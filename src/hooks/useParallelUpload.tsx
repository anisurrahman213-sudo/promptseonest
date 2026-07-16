import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractVideoFramesGrid } from '@/lib/videoFrameExtractor';
import { compressImage } from '@/lib/imageCompression';
import { MediaFile } from '@/components/MediaUploader';
import { ProcessingFile } from '@/components/dashboard/BulkProgress';
import { MetadataSettings } from '@/components/dashboard/AdvancedMetadataControls';
import { mapUploadError, type FriendlyError } from '@/lib/uploadErrorMessages';
import { extractExifContext, summarizeExif } from '@/lib/exifReader';

// Helper to build error status update from a FriendlyError
const errStatus = (err: FriendlyError): Partial<ProcessingFile> => ({
  status: 'error',
  errorMessage: err.message,
  errorHint: err.hint,
  errorCategory: err.category,
  endTime: Date.now(),
});

// Tuned to avoid Gemini gateway rate limits — too high causes 429s and skipped files
const UPLOAD_CONCURRENCY = 15;   // parallel compress + storage uploads
const ANALYZE_CONCURRENCY = 8;   // parallel edge function invocations (gateway-safe)
const ANALYZE_MAX_RETRIES = 4;   // retry transient/rate-limit errors

interface UseParallelUploadOptions {
  userId: string;
  metadataSettings: MetadataSettings;
  onFileStatusUpdate: (index: number, status: Partial<ProcessingFile>) => void;
  onSuccess: (generation: any) => void;
  onCreditRefresh: () => void;
}

interface PreparedFile {
  index: number;
  mediaFile: MediaFile;
  base64: string;
  publicUrl: string;
  startTime: number;
  exifSummary?: string | null;
}

// Generic semaphore-based parallel runner — keeps N tasks in-flight constantly
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      try {
        results[i] = await worker(items[i], i);
      } catch (err) {
        results[i] = err as any;
      }
    }
  });

  await Promise.all(runners);
  return results;
}

export function useParallelUpload({
  userId,
  metadataSettings,
  onFileStatusUpdate,
  onSuccess,
  onCreditRefresh,
}: UseParallelUploadOptions) {
  const successCountRef = useRef(0);

  // Step 1: Compress + Upload a single file
  const prepareFile = useCallback(async (
    mediaFile: MediaFile,
    index: number
  ): Promise<PreparedFile | null> => {
    const file = mediaFile.file;
    const startTime = Date.now();
    onFileStatusUpdate(index, { status: 'processing', startTime });

    try {
      let base64: string;
      let publicUrl: string;

      if (mediaFile.type === 'video') {
        base64 = await extractVideoFramesGrid(file, {
          frameCount: 4, gridCols: 2, frameWidth: 320, quality: 0.4
        });

        const frameGridBlob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob());
        const frameFileName = file.name.replace(/\.[^/.]+$/, '') + '_frames.jpg';
        const frameFilePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${frameFileName}`;
        const videoFilePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;

        const [frameUploadResult, videoUploadResult] = await Promise.all([
          supabase.storage.from('images').upload(frameFilePath, frameGridBlob, { contentType: 'image/jpeg' }),
          supabase.storage.from('videos').upload(videoFilePath, file, { contentType: file.type })
        ]);

        if (frameUploadResult.error || videoUploadResult.error) {
          const rawMsg = frameUploadResult.error?.message || videoUploadResult.error?.message;
          onFileStatusUpdate(index, errStatus(mapUploadError({ rawMessage: rawMsg, context: 'upload' })));
          return null;
        }

        const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoFilePath);
        publicUrl = videoUrlData.publicUrl;
        return { index, mediaFile, base64, publicUrl, startTime };
      } else {
        // Read EXIF from the ORIGINAL file (compression strips it) — runs in parallel
        const exifPromise = extractExifContext(file).then(summarizeExif).catch(() => null);

        // Aggressive compression for fast AI calls (small payloads)
        const compressedFile = await compressImage(file, {
          maxWidth: 1024, maxHeight: 1024, quality: 0.4, maxSizeKB: 200, aggressive: true
        });

        const base64Promise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });

        const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const uploadPromise = supabase.storage.from('images').upload(filePath, compressedFile);

        const [extractedBase64, uploadResult, exifSummary] = await Promise.all([base64Promise, uploadPromise, exifPromise]);
        base64 = extractedBase64;

        if (uploadResult.error) {
          onFileStatusUpdate(index, errStatus(mapUploadError({ rawMessage: uploadResult.error.message, context: 'upload' })));
          return null;
        }

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;

        return { index, mediaFile, base64, publicUrl, startTime, exifSummary };
      }
    } catch (error) {
      console.error('Prepare error:', error);
      const rawMsg = error instanceof Error ? error.message : '';
      onFileStatusUpdate(index, errStatus(mapUploadError({ rawMessage: rawMsg, context: 'upload' })));
      return null;
    }
  }, [userId, onFileStatusUpdate]);

  // Step 2: Analyze a single prepared file with retry on rate-limit / transient errors
  const analyzeOne = useCallback(async (prep: PreparedFile): Promise<boolean> => {
    let lastRawMsg: string | undefined;
    let lastCode: string | undefined;

    for (let attempt = 0; attempt < ANALYZE_MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke('analyze-image', {
          body: {
            imageBase64: prep.base64,
            imageName: prep.mediaFile.file.name,
            mediaType: prep.mediaFile.type,
            settings: metadataSettings,
            exif: prep.exifSummary || undefined,
          },
        });

        const rawMsg = data?.error || error?.message;
        const code = data?.code;
        const ok = !error && data?.success && data?.data;

        if (!ok) {
          lastRawMsg = rawMsg;
          lastCode = code;
          const isRateLimit =
            code === 'RATE_LIMITED' ||
            /rate.?limit|429|too many|temporar|timeout|fetch failed|network/i.test(rawMsg || '');

          if (isRateLimit && attempt < ANALYZE_MAX_RETRIES - 1) {
            // Exponential backoff with jitter: 800ms, 1.6s, 3.2s
            const delay = 800 * Math.pow(2, attempt) + Math.random() * 400;
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          onFileStatusUpdate(prep.index, errStatus(mapUploadError({ code, rawMessage: rawMsg, context: 'analyze' })));
          return false;
        }

        // Credit deduction happens atomically inside the analyze-image edge function
        // before the AI call, so no client-side deduct_credit is needed here.
        const saveResult = await supabase.from('generations').insert({
          user_id: userId,
          image_name: prep.mediaFile.file.name,
          image_url: prep.publicUrl,
          prompt: data.data.prompt,
          title: data.data.title,
          description: data.data.description,
          tags: data.data.tags,
          media_type: prep.mediaFile.type,
          category: data.data.category || '',
        }).select().single();

        if (saveResult.error) {
          onFileStatusUpdate(prep.index, errStatus(mapUploadError({ rawMessage: saveResult.error.message, context: 'save' })));
          return false;
        }


        onFileStatusUpdate(prep.index, { status: 'success', endTime: Date.now() });
        onSuccess(saveResult.data);
        onCreditRefresh();
        return true;
      } catch (err) {
        lastRawMsg = err instanceof Error ? err.message : '';
        if (attempt < ANALYZE_MAX_RETRIES - 1) {
          const delay = 800 * Math.pow(2, attempt) + Math.random() * 400;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }
    }

    onFileStatusUpdate(prep.index, errStatus(mapUploadError({ code: lastCode, rawMessage: lastRawMsg, context: 'analyze' })));
    return false;
  }, [userId, metadataSettings, onFileStatusUpdate, onSuccess, onCreditRefresh]);

  const processFilesInParallel = useCallback(async (
    mediaFiles: MediaFile[]
  ): Promise<number> => {
    successCountRef.current = 0;

    // Phase 1: Compress + Upload — parallel
    const preparedResults = await runWithConcurrency(
      mediaFiles,
      UPLOAD_CONCURRENCY,
      async (file, idx) => {
        try {
          return await prepareFile(file, idx);
        } catch (err) {
          // Safety net: surface unexpected throws as visible errors instead of silent skips
          console.error('Unexpected prepare error:', err);
          const rawMsg = err instanceof Error ? err.message : 'Unknown error';
          onFileStatusUpdate(idx, errStatus(mapUploadError({ rawMessage: rawMsg, context: 'upload' })));
          return null;
        }
      }
    );

    const validFiles = preparedResults.filter((f): f is PreparedFile => !!f && typeof f === 'object' && 'base64' in f);

    // Phase 2: AI analysis — parallel edge function invocations
    const results = await runWithConcurrency(
      validFiles,
      ANALYZE_CONCURRENCY,
      async (prep) => {
        try {
          return await analyzeOne(prep);
        } catch (err) {
          console.error('Unexpected analyze error:', err);
          const rawMsg = err instanceof Error ? err.message : 'Unknown error';
          onFileStatusUpdate(prep.index, errStatus(mapUploadError({ rawMessage: rawMsg, context: 'analyze' })));
          return false;
        }
      }
    );

    successCountRef.current = results.filter(Boolean).length;
    return successCountRef.current;
  }, [prepareFile, analyzeOne, onFileStatusUpdate]);

  return { processFilesInParallel };
}

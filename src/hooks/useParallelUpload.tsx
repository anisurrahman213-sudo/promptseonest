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

// MASSIVE PARALLELISM — 500 files in ~10s requires extreme concurrency
// Each edge invocation = 1 image (avoids CPU/wall-time limits per request)
// Modern browsers/Supabase handle 25-30 concurrent fetches well
const UPLOAD_CONCURRENCY = 25;   // parallel compress + storage uploads
const ANALYZE_CONCURRENCY = 30;  // parallel edge function invocations

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
      } else {
        // Read EXIF from the ORIGINAL file (compression strips it) — non-blocking, runs in parallel
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

        const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const uploadPromise = supabase.storage.from('images').upload(filePath, compressedFile);

        const [extractedBase64, uploadResult] = await Promise.all([base64Promise, uploadPromise]);
        base64 = extractedBase64;

        if (uploadResult.error) {
          onFileStatusUpdate(index, errStatus(mapUploadError({ rawMessage: uploadResult.error.message, context: 'upload' })));
          return null;
        }

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      return { index, mediaFile, base64, publicUrl, startTime };
    } catch (error) {
      console.error('Prepare error:', error);
      const rawMsg = error instanceof Error ? error.message : '';
      onFileStatusUpdate(index, errStatus(mapUploadError({ rawMessage: rawMsg, context: 'upload' })));
      return null;
    }
  }, [userId, onFileStatusUpdate]);

  // Step 2: Analyze a single prepared file (one edge function invocation per file)
  const analyzeOne = useCallback(async (prep: PreparedFile): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: {
          imageBase64: prep.base64,
          imageName: prep.mediaFile.file.name,
          mediaType: prep.mediaFile.type,
          settings: metadataSettings,
        },
      });

      if (error || !data?.success || !data?.data) {
        const rawMsg = data?.error || error?.message;
        const code = data?.code;
        onFileStatusUpdate(prep.index, errStatus(mapUploadError({ code, rawMessage: rawMsg, context: 'analyze' })));
        return false;
      }

      const [creditResult, saveResult] = await Promise.all([
        supabase.rpc('deduct_credit'),
        supabase.from('generations').insert({
          user_id: userId,
          image_name: prep.mediaFile.file.name,
          image_url: prep.publicUrl,
          prompt: data.data.prompt,
          title: data.data.title,
          description: data.data.description,
          tags: data.data.tags,
          media_type: prep.mediaFile.type,
          category: data.data.category || '',
        }).select().single(),
      ]);

      if (saveResult.error) {
        onFileStatusUpdate(prep.index, errStatus(mapUploadError({ rawMessage: saveResult.error.message, context: 'save' })));
        return false;
      }
      if (creditResult.data === false) {
        onFileStatusUpdate(prep.index, errStatus(mapUploadError({ context: 'credit' })));
        return false;
      }

      onFileStatusUpdate(prep.index, { status: 'success', endTime: Date.now() });
      onSuccess(saveResult.data);
      onCreditRefresh();
      return true;
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : '';
      onFileStatusUpdate(prep.index, errStatus(mapUploadError({ rawMessage: rawMsg, context: 'analyze' })));
      return false;
    }
  }, [userId, metadataSettings, onFileStatusUpdate, onSuccess, onCreditRefresh]);

  const processFilesInParallel = useCallback(async (
    mediaFiles: MediaFile[]
  ): Promise<number> => {
    successCountRef.current = 0;

    // Phase 1: Compress + Upload — 25 in parallel constantly
    const preparedResults = await runWithConcurrency(
      mediaFiles,
      UPLOAD_CONCURRENCY,
      (file, idx) => prepareFile(file, idx)
    );

    const validFiles = preparedResults.filter((f): f is PreparedFile => !!f && typeof f === 'object' && 'base64' in f);

    // Phase 2: AI analysis — 30 edge function invocations in parallel constantly
    const results = await runWithConcurrency(
      validFiles,
      ANALYZE_CONCURRENCY,
      (prep) => analyzeOne(prep)
    );

    successCountRef.current = results.filter(Boolean).length;
    return successCountRef.current;
  }, [prepareFile, analyzeOne]);

  return { processFilesInParallel };
}

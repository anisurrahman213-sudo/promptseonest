import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractVideoFramesGrid } from '@/lib/videoFrameExtractor';
import { compressImage } from '@/lib/imageCompression';
import { MediaFile } from '@/components/MediaUploader';
import { ProcessingFile } from '@/components/dashboard/BulkProgress';
import { MetadataSettings } from '@/components/dashboard/AdvancedMetadataControls';

// Process many files concurrently for maximum speed
const MAX_CONCURRENT = 80;
const STAGGER_DELAY_MS = 50;
const BATCH_SIZE = 5; // Send 5 images per batch AI call

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
}

export function useParallelUpload({
  userId,
  metadataSettings,
  onFileStatusUpdate,
  onSuccess,
  onCreditRefresh,
}: UseParallelUploadOptions) {
  const successCountRef = useRef(0);

  // Step 1: Compress + Upload a single file, return base64 + publicUrl
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
          onFileStatusUpdate(index, { status: 'error', errorMessage: 'Upload failed', endTime: Date.now() });
          return null;
        }
        
        const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoFilePath);
        publicUrl = videoUrlData.publicUrl;
      } else {
        const compressedFile = await compressImage(file, {
          maxWidth: 1200, maxHeight: 1200, quality: 0.35, maxSizeKB: 150, aggressive: true
        });
        
        const base64Promise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
        
        const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const uploadPromise = supabase.storage.from('images').upload(filePath, compressedFile);
        
        const [extractedBase64, uploadResult] = await Promise.all([base64Promise, uploadPromise]);
        base64 = extractedBase64;
        
        if (uploadResult.error) {
          onFileStatusUpdate(index, { status: 'error', errorMessage: 'Upload failed', endTime: Date.now() });
          return null;
        }
        
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      return { index, mediaFile, base64, publicUrl, startTime };
    } catch (error) {
      console.error('Prepare error:', error);
      onFileStatusUpdate(index, { status: 'error', errorMessage: 'Processing error', endTime: Date.now() });
      return null;
    }
  }, [userId, onFileStatusUpdate]);

  // Step 2: Send batch AI analysis and save results
  const analyzeBatch = useCallback(async (prepared: PreparedFile[]): Promise<boolean[]> => {
    if (prepared.length === 0) return [];

    // Try batch mode first
    if (prepared.length > 1) {
      try {
        const batchItems = prepared.map(p => ({
          imageBase64: p.base64,
          imageName: p.mediaFile.file.name,
          mediaType: p.mediaFile.type,
        }));

        const { data, error } = await supabase.functions.invoke('analyze-image', {
          body: { batch: batchItems, settings: metadataSettings }
        });

        if (!error && data?.batch && data?.results) {
          const results: boolean[] = [];
          
          // Process each result from the batch
          const savePromises = data.results.map(async (result: any, idx: number) => {
            const prep = prepared[idx];
            if (!result.success || !result.data) {
              onFileStatusUpdate(prep.index, { 
                status: 'error', 
                errorMessage: result.error || 'Analysis failed', 
                endTime: Date.now() 
              });
              return false;
            }

            // Deduct credit and save
            const [creditResult, saveResult] = await Promise.all([
              supabase.rpc('deduct_credit'),
              supabase.from('generations').insert({
                user_id: userId,
                image_name: prep.mediaFile.file.name,
                image_url: prep.publicUrl,
                prompt: result.data.prompt,
                title: result.data.title,
                description: result.data.description,
                tags: result.data.tags,
                media_type: prep.mediaFile.type,
                category: result.data.category || ''
              }).select().single()
            ]);

            if (!creditResult.data || saveResult.error) {
              onFileStatusUpdate(prep.index, { 
                status: 'error', 
                errorMessage: saveResult.error ? 'Save failed' : 'Credit deduction failed', 
                endTime: Date.now() 
              });
              return false;
            }

            onFileStatusUpdate(prep.index, { status: 'success', endTime: Date.now() });
            onSuccess(saveResult.data);
            onCreditRefresh();
            return true;
          });

          return Promise.all(savePromises);
        }
      } catch (batchError) {
        console.warn('Batch mode failed, falling back to single:', batchError);
      }
    }

    // Fallback: process individually
    return Promise.all(prepared.map(async (prep) => {
      try {
        const { data, error } = await supabase.functions.invoke('analyze-image', {
          body: { 
            imageBase64: prep.base64,
            imageName: prep.mediaFile.file.name,
            mediaType: prep.mediaFile.type,
            settings: metadataSettings
          }
        });

        if (error || data?.error) {
          onFileStatusUpdate(prep.index, { status: 'error', errorMessage: data?.error || 'Analysis failed', endTime: Date.now() });
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
            category: data.data.category || ''
          }).select().single()
        ]);

        if (!creditResult.data || saveResult.error) {
          onFileStatusUpdate(prep.index, { status: 'error', errorMessage: 'Save failed', endTime: Date.now() });
          return false;
        }

        onFileStatusUpdate(prep.index, { status: 'success', endTime: Date.now() });
        onSuccess(saveResult.data);
        onCreditRefresh();
        return true;
      } catch {
        onFileStatusUpdate(prep.index, { status: 'error', errorMessage: 'Processing error', endTime: Date.now() });
        return false;
      }
    }));
  }, [userId, metadataSettings, onFileStatusUpdate, onSuccess, onCreditRefresh]);

  const processFilesInParallel = useCallback(async (
    mediaFiles: MediaFile[]
  ): Promise<number> => {
    successCountRef.current = 0;
    
    // Phase 1: Compress + Upload all files in parallel batches
    const preparedFiles: (PreparedFile | null)[] = [];
    
    for (let i = 0; i < mediaFiles.length; i += MAX_CONCURRENT) {
      const batch = mediaFiles.slice(i, Math.min(i + MAX_CONCURRENT, mediaFiles.length));
      const batchResults = await Promise.all(
        batch.map((file, batchIdx) => 
          new Promise<PreparedFile | null>(resolve => 
            setTimeout(() => prepareFile(file, i + batchIdx).then(resolve), batchIdx * STAGGER_DELAY_MS)
          )
        )
      );
      preparedFiles.push(...batchResults);
    }

    // Phase 2: Batch AI analysis — send BATCH_SIZE files per request
    const validFiles = preparedFiles.filter((f): f is PreparedFile => f !== null);
    
    for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
      const batch = validFiles.slice(i, Math.min(i + BATCH_SIZE, validFiles.length));
      const results = await analyzeBatch(batch);
      successCountRef.current += results.filter(Boolean).length;
    }
    
    return successCountRef.current;
  }, [prepareFile, analyzeBatch]);

  return { processFilesInParallel };
}

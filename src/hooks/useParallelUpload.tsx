import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractVideoFramesGrid } from '@/lib/videoFrameExtractor';
import { MediaFile } from '@/components/MediaUploader';
import { ProcessingFile } from '@/components/dashboard/BulkProgress';
import { MetadataSettings } from '@/components/dashboard/AdvancedMetadataControls';

// Maximum concurrent uploads for maximum speed
const MAX_CONCURRENT = 10;

interface UseParallelUploadOptions {
  userId: string;
  metadataSettings: MetadataSettings;
  onFileStatusUpdate: (index: number, status: Partial<ProcessingFile>) => void;
  onSuccess: (generation: any) => void;
  onCreditRefresh: () => void;
}

export function useParallelUpload({
  userId,
  metadataSettings,
  onFileStatusUpdate,
  onSuccess,
  onCreditRefresh,
}: UseParallelUploadOptions) {
  const successCountRef = useRef(0);

  const processFile = useCallback(async (
    mediaFile: MediaFile,
    index: number
  ): Promise<boolean> => {
    const file = mediaFile.file;
    const startTime = Date.now();
    
    // Mark as processing
    onFileStatusUpdate(index, { status: 'processing', startTime });

    try {
      // Step 1: Prepare base64 (parallel with upload for images)
      let base64Promise: Promise<string>;
      
      if (mediaFile.type === 'video') {
        base64Promise = extractVideoFramesGrid(file, {
          frameCount: 6,
          gridCols: 3,
          frameWidth: 640,
          quality: 0.85
        });
      } else {
        base64Promise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Step 2: Upload to storage (parallel with base64 extraction)
      const bucketName = mediaFile.type === 'video' ? 'videos' : 'images';
      const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      
      const uploadPromise = supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      // Wait for both in parallel
      const [base64, uploadResult] = await Promise.all([base64Promise, uploadPromise]);

      if (uploadResult.error) {
        console.error('Upload error:', uploadResult.error);
        onFileStatusUpdate(index, { status: 'error', errorMessage: 'Upload failed', endTime: Date.now() });
        return false;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Step 3: AI Analysis
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { 
          imageBase64: base64,
          imageName: file.name,
          mediaType: mediaFile.type,
          settings: metadataSettings
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        onFileStatusUpdate(index, { status: 'error', errorMessage: 'Analysis failed', endTime: Date.now() });
        return false;
      }

      if (data.error) {
        onFileStatusUpdate(index, { status: 'error', errorMessage: data.error, endTime: Date.now() });
        return false;
      }

      // Step 4: Deduct credit and save to database in parallel
      const [creditResult, saveResult] = await Promise.all([
        supabase.rpc('deduct_credit', { p_user_id: userId }),
        supabase
          .from('generations')
          .insert({
            user_id: userId,
            image_name: data.data.imageName,
            image_url: publicUrl,
            prompt: data.data.prompt,
            title: data.data.title,
            description: data.data.description,
            tags: data.data.tags
          })
          .select()
          .single()
      ]);

      if (!creditResult.data) {
        onFileStatusUpdate(index, { status: 'error', errorMessage: 'Credit deduction failed', endTime: Date.now() });
        return false;
      }

      if (saveResult.error) {
        console.error('Save error:', saveResult.error);
        onFileStatusUpdate(index, { status: 'error', errorMessage: 'Save failed', endTime: Date.now() });
        return false;
      }

      // Success!
      onFileStatusUpdate(index, { status: 'success', endTime: Date.now() });
      onSuccess(saveResult.data);
      onCreditRefresh();
      return true;
    } catch (error) {
      console.error('Processing error:', error);
      onFileStatusUpdate(index, { status: 'error', errorMessage: 'Processing error', endTime: Date.now() });
      return false;
    }
  }, [userId, metadataSettings, onFileStatusUpdate, onSuccess, onCreditRefresh]);

  const processFilesInParallel = useCallback(async (
    mediaFiles: MediaFile[]
  ): Promise<number> => {
    successCountRef.current = 0;
    const results: boolean[] = [];
    
    // Process files in batches of MAX_CONCURRENT
    for (let i = 0; i < mediaFiles.length; i += MAX_CONCURRENT) {
      const batch = mediaFiles.slice(i, Math.min(i + MAX_CONCURRENT, mediaFiles.length));
      const batchIndices = batch.map((_, idx) => i + idx);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map((file, batchIdx) => processFile(file, batchIndices[batchIdx]))
      );
      
      results.push(...batchResults);
      successCountRef.current += batchResults.filter(Boolean).length;
    }
    
    return successCountRef.current;
  }, [processFile]);

  return { processFilesInParallel };
}

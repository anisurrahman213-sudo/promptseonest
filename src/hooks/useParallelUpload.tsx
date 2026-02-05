import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractVideoFramesGrid } from '@/lib/videoFrameExtractor';
import { compressImage } from '@/lib/imageCompression';
import { MediaFile } from '@/components/MediaUploader';
import { ProcessingFile } from '@/components/dashboard/BulkProgress';
import { MetadataSettings } from '@/components/dashboard/AdvancedMetadataControls';

// Optimized concurrent uploads - balanced for speed and stability
const MAX_CONCURRENT = 25;

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
      let base64: string;
      let publicUrl: string;
      
      if (mediaFile.type === 'video') {
        // VIDEO PROCESSING:
        // 1. Extract frame grid for AI analysis
        // 2. Upload original video to videos bucket for playback
        console.log(`🎬 Video processing: ${file.name}`);
        
        base64 = await extractVideoFramesGrid(file, {
          frameCount: 6,
          gridCols: 3,
          frameWidth: 640,
          quality: 0.85
        });
        
        // Upload original video and frame grid in parallel
        const frameGridBlob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob());
        const frameFileName = file.name.replace(/\.[^/.]+$/, '') + '_frames.jpg';
        const frameFilePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${frameFileName}`;
        const videoFilePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        
        console.log(`📦 Frame grid: ${(frameGridBlob.size / 1024).toFixed(1)}KB, Video: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
        
        const [frameUploadResult, videoUploadResult] = await Promise.all([
          supabase.storage.from('images').upload(frameFilePath, frameGridBlob, { contentType: 'image/jpeg' }),
          supabase.storage.from('videos').upload(videoFilePath, file, { contentType: file.type })
        ]);
        
        if (frameUploadResult.error || videoUploadResult.error) {
          console.error('Upload error:', frameUploadResult.error || videoUploadResult.error);
          onFileStatusUpdate(index, { status: 'error', errorMessage: 'Upload failed', endTime: Date.now() });
          return false;
        }
        
        // Use video URL for playback
        const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoFilePath);
        publicUrl = videoUrlData.publicUrl;
        
      } else {
        // IMAGE PROCESSING: Compress first, then upload
        console.log(`🖼️ Image processing: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
        
        // Compress the image first
        const compressedFile = await compressImage(file, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 0.75,
          maxSizeKB: 400,
          aggressive: true
        });
        
        console.log(`📦 Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (-${((1 - compressedFile.size / file.size) * 100).toFixed(0)}%)`);
        
        // Read base64 from compressed file
        const base64Promise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
        
        const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        // Upload compressed file instead of original
        const uploadPromise = supabase.storage.from('images').upload(filePath, compressedFile);
        
        const [extractedBase64, uploadResult] = await Promise.all([base64Promise, uploadPromise]);
        base64 = extractedBase64;
        
        if (uploadResult.error) {
          console.error('Upload error:', uploadResult.error);
          onFileStatusUpdate(index, { status: 'error', errorMessage: 'Upload failed', endTime: Date.now() });
          return false;
        }
        
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

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
      // IMPORTANT: Use original file.name for Filename column (Adobe Stock requires exact match)
      const [creditResult, saveResult] = await Promise.all([
        supabase.rpc('deduct_credit'),
        supabase
          .from('generations')
          .insert({
            user_id: userId,
            image_name: file.name, // Use ORIGINAL filename, not AI-generated name
            image_url: publicUrl,
            prompt: data.data.prompt,
            title: data.data.title,
            description: data.data.description,
            tags: data.data.tags,
            media_type: mediaFile.type,
            category: data.data.category || ''
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

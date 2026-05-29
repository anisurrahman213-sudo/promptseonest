import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractVideoFramesGrid } from '@/lib/videoFrameExtractor';
import { compressImage } from '@/lib/imageCompression';
import { MediaFile } from '@/components/MediaUploader';
import { MetadataSettings } from '@/components/dashboard/AdvancedMetadataControls';
import { toast } from 'sonner';

// Keep AI requests intentionally paced to avoid provider quota bursts.
const MAX_CONCURRENT = 3;
const STAGGER_DELAY_MS = 750;
const ANALYSIS_MAX_ATTEMPTS = 3;
const ANALYSIS_RETRY_BASE_MS = 2500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ProcessingFile {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  startTime?: number;
  endTime?: number;
  errorMessage?: string;
}

export interface ProcessingJob {
  id: string;
  files: ProcessingFile[];
  totalFiles: number;
  completedFiles: number;
  successCount: number;
  errorCount: number;
  isProcessing: boolean;
  startedAt: number;
}

interface BackgroundProcessorContextType {
  currentJob: ProcessingJob | null;
  isProcessing: boolean;
  startProcessing: (
    mediaFiles: MediaFile[],
    userId: string,
    metadataSettings: MetadataSettings,
    onSuccess: (generation: any) => void,
    onCreditRefresh: () => void
  ) => Promise<void>;
  clearJob: () => void;
}

const BackgroundProcessorContext = createContext<BackgroundProcessorContextType | undefined>(undefined);

export function BackgroundProcessorProvider({ children }: { children: ReactNode }) {
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const processingRef = useRef(false);

  const updateFileStatus = useCallback((jobId: string, fileId: string, updates: Partial<ProcessingFile>) => {
    setCurrentJob(prev => {
      if (!prev || prev.id !== jobId) return prev;
      
      const updatedFiles = prev.files.map(f => 
        f.id === fileId ? { ...f, ...updates } : f
      );
      
      const completedFiles = updatedFiles.filter(f => f.status === 'success' || f.status === 'error').length;
      const successCount = updatedFiles.filter(f => f.status === 'success').length;
      const errorCount = updatedFiles.filter(f => f.status === 'error').length;
      
      return {
        ...prev,
        files: updatedFiles,
        completedFiles,
        successCount,
        errorCount,
        isProcessing: completedFiles < prev.totalFiles
      };
    });
  }, []);

  const processFile = useCallback(async (
    jobId: string,
    mediaFile: MediaFile,
    fileId: string,
    userId: string,
    metadataSettings: MetadataSettings,
    onSuccess: (generation: any) => void,
    onCreditRefresh: () => void
  ): Promise<boolean> => {
    const file = mediaFile.file;
    const startTime = Date.now();
    
    updateFileStatus(jobId, fileId, { status: 'processing', startTime });

    try {
      let base64: string;
      let publicUrl: string;
      
      if (mediaFile.type === 'video') {
        // VIDEO PROCESSING:
        // 1. Extract frame grid for AI analysis (fast, lightweight)
        // 2. Upload original video to videos bucket for playback
        // 3. Upload frame grid to images bucket for thumbnail
        
        console.log(`🎬 Video processing: ${file.name}`);
        
        // Extract frame grid as base64 for AI analysis
        base64 = await extractVideoFramesGrid(file, {
          frameCount: 4,
          gridCols: 2,
          frameWidth: 320,
          quality: 0.4
        });
        
        // Upload original video and frame grid in parallel
        const frameGridBlob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob());
        const frameFileName = file.name.replace(/\.[^/.]+$/, '') + '_frames.jpg';
        const frameFilePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${frameFileName}`;
        const videoFilePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        
        console.log(`📦 Frame grid: ${(frameGridBlob.size / 1024).toFixed(1)}KB, Video: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
        
        // Upload both in parallel - frame grid for thumbnail, video for playback
        const [frameUploadResult, videoUploadResult] = await Promise.all([
          supabase.storage.from('images').upload(frameFilePath, frameGridBlob, { contentType: 'image/jpeg' }),
          supabase.storage.from('videos').upload(videoFilePath, file, { contentType: file.type })
        ]);
        
        if (frameUploadResult.error || videoUploadResult.error) {
          console.error('Upload error:', frameUploadResult.error || videoUploadResult.error);
          updateFileStatus(jobId, fileId, { status: 'error', errorMessage: 'Upload failed', endTime: Date.now() });
          return false;
        }
        
        // Use video URL for playback (not frame grid)
        const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoFilePath);
        publicUrl = videoUrlData.publicUrl;
        
      } else {
        // IMAGE PROCESSING: Compress first, then upload
        console.log(`🖼️ Image processing: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
        
        // Compress the image first
        const compressedFile = await compressImage(file, {
          maxWidth: 1400,
          maxHeight: 1400,
          quality: 0.5,
          maxSizeKB: 200,
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
          updateFileStatus(jobId, fileId, { status: 'error', errorMessage: 'Upload failed', endTime: Date.now() });
          return false;
        }
        
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      // Step 3: AI Analysis with retry/backoff for temporary rate limits
      let data: any = null;
      let error: any = null;

      for (let attempt = 1; attempt <= ANALYSIS_MAX_ATTEMPTS; attempt++) {
        const result = await supabase.functions.invoke('analyze-image', {
          body: { 
            imageBase64: base64,
            imageName: file.name,
            mediaType: mediaFile.type,
            settings: metadataSettings
          }
        });

        data = result.data;
        error = result.error;

        const rawMessage = data?.error || error?.message || '';
        const isRetryable =
          data?.code === 'RATE_LIMITED' ||
          /rate.?limit|quota|429|too many|temporar|timeout|network|fetch failed/i.test(rawMessage);

        if (!isRetryable || attempt === ANALYSIS_MAX_ATTEMPTS) break;

        const retryAfterMs = Number(data?.retryAfter || 0) > 0
          ? Math.min(Number(data.retryAfter) * 1000, 15000)
          : ANALYSIS_RETRY_BASE_MS * attempt;

        updateFileStatus(jobId, fileId, {
          status: 'processing',
          errorMessage: `AI busy — retrying ${attempt}/${ANALYSIS_MAX_ATTEMPTS - 1}`
        });
        await wait(retryAfterMs + Math.floor(Math.random() * 600));
      }

      if (error) {
        console.error('Analysis error:', error);
        updateFileStatus(jobId, fileId, {
          status: 'error',
          errorMessage: error.message || 'Analysis failed',
          endTime: Date.now()
        });
        return false;
      }

      if (data?.success === false || data?.error) {
        console.error('❌ Analysis returned error:', { success: data?.success, error: data?.error, code: data?.code });
        updateFileStatus(jobId, fileId, {
          status: 'error',
          errorMessage: data?.code === 'RATE_LIMITED'
            ? 'AI is busy. Please retry in a minute.'
            : data?.error || 'Analysis failed',
          endTime: Date.now()
        });
        return false;
      }

      // Defensive: ensure data.data exists with required fields
      if (!data?.data?.prompt || !data?.data?.title) {
        console.error('❌ Analysis response missing fields:', data);
        updateFileStatus(jobId, fileId, {
          status: 'error',
          errorMessage: 'AI returned incomplete data',
          endTime: Date.now()
        });
        return false;
      }

      // Step 4: Deduct credit and save to database in parallel
      const [creditResult, saveResult] = await Promise.all([
        supabase.rpc('deduct_credit'),
        supabase
          .from('generations')
          .insert({
            user_id: userId,
            image_name: file.name,
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

      if (creditResult.error) {
        console.error('❌ Credit RPC error:', creditResult.error);
        updateFileStatus(jobId, fileId, { status: 'error', errorMessage: `Credit error: ${creditResult.error.message}`, endTime: Date.now() });
        return false;
      }
      if (creditResult.data === false) {
        updateFileStatus(jobId, fileId, { status: 'error', errorMessage: 'Insufficient credits', endTime: Date.now() });
        return false;
      }

      if (saveResult.error) {
        console.error('❌ Save error:', saveResult.error, 'payload:', { user_id: userId, image_name: file.name, has_data: !!data.data });
        updateFileStatus(jobId, fileId, { status: 'error', errorMessage: `Save failed: ${saveResult.error.message}`, endTime: Date.now() });
        return false;
      }

      // Success!
      updateFileStatus(jobId, fileId, { status: 'success', endTime: Date.now() });
      onSuccess(saveResult.data);
      onCreditRefresh();
      return true;
    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Processing error';
      updateFileStatus(jobId, fileId, { status: 'error', errorMessage, endTime: Date.now() });
      return false;
    }
  }, [updateFileStatus]);

  const startProcessing = useCallback(async (
    mediaFiles: MediaFile[],
    userId: string,
    metadataSettings: MetadataSettings,
    onSuccess: (generation: any) => void,
    onCreditRefresh: () => void
  ) => {
    if (processingRef.current) {
      toast.error('Already processing files. Please wait.');
      return;
    }

    processingRef.current = true;
    const jobId = `job-${Date.now()}`;
    
    // Initialize job
    const initialFiles: ProcessingFile[] = mediaFiles.map((mf, idx) => ({
      id: `${jobId}-file-${idx}`,
      name: mf.file.name,
      status: 'pending'
    }));

    const newJob: ProcessingJob = {
      id: jobId,
      files: initialFiles,
      totalFiles: mediaFiles.length,
      completedFiles: 0,
      successCount: 0,
      errorCount: 0,
      isProcessing: true,
      startedAt: Date.now()
    };

    setCurrentJob(newJob);
    toast.info(`🚀 Processing ${mediaFiles.length} file${mediaFiles.length > 1 ? 's' : ''} in background...`);

    // Process files in batches of MAX_CONCURRENT
    for (let i = 0; i < mediaFiles.length; i += MAX_CONCURRENT) {
      const batch = mediaFiles.slice(i, Math.min(i + MAX_CONCURRENT, mediaFiles.length));
      const batchFileIds = initialFiles.slice(i, Math.min(i + MAX_CONCURRENT, mediaFiles.length)).map(f => f.id);
      
      // Process each batch with a small stagger to avoid burst rate limiting
      await Promise.all(
        batch.map(
          (file, batchIdx) =>
            new Promise<boolean>((resolve) => {
              setTimeout(() => {
                processFile(
                  jobId,
                  file,
                  batchFileIds[batchIdx],
                  userId,
                  metadataSettings,
                  onSuccess,
                  onCreditRefresh
                ).then(resolve);
              }, batchIdx * STAGGER_DELAY_MS);
            })
        )
      );
    }

    processingRef.current = false;
    
    // Get final counts
    setCurrentJob(prev => {
      if (!prev || prev.id !== jobId) return prev;
      
      const finalSuccessCount = prev.files.filter(f => f.status === 'success').length;
      const finalErrorCount = prev.files.filter(f => f.status === 'error').length;
      
      if (finalSuccessCount > 0) {
        toast.success(`✅ ${finalSuccessCount} file${finalSuccessCount > 1 ? 's' : ''} processed successfully!`);
      }
      if (finalErrorCount > 0) {
        toast.error(`❌ ${finalErrorCount} file${finalErrorCount > 1 ? 's' : ''} failed to process.`);
      }
      
      return {
        ...prev,
        isProcessing: false
      };
    });
  }, [processFile]);

  const clearJob = useCallback(() => {
    if (!processingRef.current) {
      setCurrentJob(null);
    }
  }, []);

  return (
    <BackgroundProcessorContext.Provider value={{
      currentJob,
      isProcessing: processingRef.current || (currentJob?.isProcessing ?? false),
      startProcessing,
      clearJob
    }}>
      {children}
    </BackgroundProcessorContext.Provider>
  );
}

export function useBackgroundProcessor() {
  const context = useContext(BackgroundProcessorContext);
  if (!context) {
    throw new Error('useBackgroundProcessor must be used within a BackgroundProcessorProvider');
  }
  return context;
}

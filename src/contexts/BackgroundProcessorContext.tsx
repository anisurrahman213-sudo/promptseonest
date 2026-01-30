import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractVideoFramesGrid } from '@/lib/videoFrameExtractor';
import { MediaFile } from '@/components/MediaUploader';
import { MetadataSettings } from '@/components/dashboard/AdvancedMetadataControls';
import { toast } from 'sonner';

// Optimized concurrent uploads - balanced for speed and stability
const MAX_CONCURRENT = 25;

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
        // OPTIMIZED VIDEO PROCESSING:
        // 1. Extract frame grid (fast, ~10-12 seconds)
        // 2. Convert frame grid to blob and upload (small, ~200-400KB vs 50-500MB original)
        // This makes video processing 10-20x faster!
        
        console.log(`🎬 Optimized video processing: ${file.name}`);
        
        // Extract frame grid as base64
        base64 = await extractVideoFramesGrid(file, {
          frameCount: 6,
          gridCols: 3,
          frameWidth: 640,
          quality: 0.85
        });
        
        // Convert base64 to blob for upload (much smaller than original video!)
        const frameGridBlob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob());
        const frameFileName = file.name.replace(/\.[^/.]+$/, '') + '_frames.jpg';
        const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${frameFileName}`;
        
        console.log(`📦 Video frame grid size: ${(frameGridBlob.size / 1024).toFixed(1)}KB (original: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        
        // Upload the small frame grid image instead of full video
        const uploadResult = await supabase.storage
          .from('images') // Use images bucket for the frame grid
          .upload(filePath, frameGridBlob, { contentType: 'image/jpeg' });
        
        if (uploadResult.error) {
          console.error('Upload error:', uploadResult.error);
          updateFileStatus(jobId, fileId, { status: 'error', errorMessage: 'Upload failed', endTime: Date.now() });
          return false;
        }
        
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
        
      } else {
        // IMAGE PROCESSING: Compress and upload in parallel
        const base64Promise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const uploadPromise = supabase.storage.from('images').upload(filePath, file);
        
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
        updateFileStatus(jobId, fileId, { status: 'error', errorMessage: 'Analysis failed', endTime: Date.now() });
        return false;
      }

      if (data.error) {
        updateFileStatus(jobId, fileId, { status: 'error', errorMessage: data.error, endTime: Date.now() });
        return false;
      }

      // Step 4: Deduct credit and save to database in parallel
      const [creditResult, saveResult] = await Promise.all([
        supabase.rpc('deduct_credit'),
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
        updateFileStatus(jobId, fileId, { status: 'error', errorMessage: 'Credit deduction failed', endTime: Date.now() });
        return false;
      }

      if (saveResult.error) {
        console.error('Save error:', saveResult.error);
        updateFileStatus(jobId, fileId, { status: 'error', errorMessage: 'Save failed', endTime: Date.now() });
        return false;
      }

      // Success!
      updateFileStatus(jobId, fileId, { status: 'success', endTime: Date.now() });
      onSuccess(saveResult.data);
      onCreditRefresh();
      return true;
    } catch (error) {
      console.error('Processing error:', error);
      updateFileStatus(jobId, fileId, { status: 'error', errorMessage: 'Processing error', endTime: Date.now() });
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
      
      // Process batch in parallel
      await Promise.all(
        batch.map((file, batchIdx) => 
          processFile(jobId, file, batchFileIds[batchIdx], userId, metadataSettings, onSuccess, onCreditRefresh)
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

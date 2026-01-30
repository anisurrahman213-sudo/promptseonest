export interface VideoCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  videoBitrate?: number; // kbps
  audioBitrate?: number; // kbps
  frameRate?: number;
}

export interface VideoCompressionProgress {
  fileName: string;
  originalSize: number;
  status: 'compressing' | 'done' | 'error' | 'skipped';
  compressedSize?: number;
  progress?: number;
}

const DEFAULT_OPTIONS: VideoCompressionOptions = {
  maxWidth: 1280,
  maxHeight: 720,
  videoBitrate: 1000, // 1 Mbps
  audioBitrate: 128,
  frameRate: 30,
};

/**
 * Compress a video file using canvas + MediaRecorder
 * This reduces resolution and bitrate for faster uploads
 */
export async function compressVideo(
  file: File,
  options: VideoCompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Skip if file is already small (under 5MB)
  if (file.size < 5 * 1024 * 1024) {
    console.log(`⏭️ Video already small, skipping compression: ${file.name}`);
    return file;
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    const url = URL.createObjectURL(file);
    video.src = url;
    
    video.onloadedmetadata = async () => {
      try {
        // Calculate target dimensions while maintaining aspect ratio
        let targetWidth = video.videoWidth;
        let targetHeight = video.videoHeight;
        
        if (targetWidth > opts.maxWidth! || targetHeight > opts.maxHeight!) {
          const aspectRatio = targetWidth / targetHeight;
          if (targetWidth > targetHeight) {
            targetWidth = Math.min(targetWidth, opts.maxWidth!);
            targetHeight = Math.round(targetWidth / aspectRatio);
          } else {
            targetHeight = Math.min(targetHeight, opts.maxHeight!);
            targetWidth = Math.round(targetHeight * aspectRatio);
          }
        }
        
        // Ensure dimensions are even (required for some codecs)
        targetWidth = Math.floor(targetWidth / 2) * 2;
        targetHeight = Math.floor(targetHeight / 2) * 2;
        
        console.log(`🎬 Compressing video: ${file.name}`);
        console.log(`📐 ${video.videoWidth}x${video.videoHeight} → ${targetWidth}x${targetHeight}`);
        
        // Create canvas for frame rendering
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d')!;
        
        // Get canvas stream
        const stream = canvas.captureStream(opts.frameRate);
        
        // Try to add audio track if video has audio
        try {
          // @ts-ignore - captureStream exists on video elements
          const audioStream = video.captureStream?.();
          if (audioStream) {
            const audioTracks = audioStream.getAudioTracks();
            if (audioTracks.length > 0) {
              stream.addTrack(audioTracks[0]);
            }
          }
        } catch (e) {
          console.log('No audio track to add');
        }
        
        // Determine supported MIME type
        const mimeTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4',
        ];
        
        let mimeType = 'video/webm';
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: opts.videoBitrate! * 1000,
          audioBitsPerSecond: opts.audioBitrate! * 1000,
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          URL.revokeObjectURL(url);
          
          const blob = new Blob(chunks, { type: mimeType });
          
          // Generate new filename with .webm extension if needed
          const ext = mimeType.includes('webm') ? '.webm' : '.mp4';
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const newFileName = `${baseName}_compressed${ext}`;
          
          const compressedFile = new File([blob], newFileName, { type: mimeType });
          
          console.log(`✅ Compressed: ${(file.size / (1024 * 1024)).toFixed(1)}MB → ${(compressedFile.size / (1024 * 1024)).toFixed(1)}MB (-${((1 - compressedFile.size / file.size) * 100).toFixed(0)}%)`);
          
          // If compressed file is larger, return original
          if (compressedFile.size >= file.size) {
            console.log('⚠️ Compressed file larger than original, using original');
            resolve(file);
          } else {
            resolve(compressedFile);
          }
        };
        
        mediaRecorder.onerror = (e) => {
          URL.revokeObjectURL(url);
          console.error('MediaRecorder error:', e);
          resolve(file); // Return original on error
        };
        
        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        
        // Play video and draw to canvas
        video.currentTime = 0;
        
        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }
          
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          requestAnimationFrame(drawFrame);
        };
        
        video.onplay = drawFrame;
        video.onended = () => {
          mediaRecorder.stop();
        };
        
        // Start playback
        video.play().catch((e) => {
          console.error('Video play error:', e);
          URL.revokeObjectURL(url);
          resolve(file); // Return original on error
        });
        
      } catch (error) {
        URL.revokeObjectURL(url);
        console.error('Video compression error:', error);
        resolve(file); // Return original on error
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      console.error('Video load error');
      resolve(file); // Return original on error
    };
  });
}

/**
 * Compress multiple videos in parallel with progress tracking
 */
export async function compressVideos(
  files: File[],
  options: VideoCompressionOptions = {},
  concurrency: number = 2,
  onProgress?: (progress: VideoCompressionProgress[]) => void
): Promise<File[]> {
  const progress: VideoCompressionProgress[] = files.map(f => ({
    fileName: f.name,
    originalSize: f.size,
    status: 'compressing' as const,
    progress: 0,
  }));
  
  if (onProgress) onProgress([...progress]);
  
  const results: File[] = new Array(files.length);
  let currentIndex = 0;
  
  const processNext = async (): Promise<void> => {
    const index = currentIndex++;
    if (index >= files.length) return;
    
    const file = files[index];
    
    try {
      const compressed = await compressVideo(file, options);
      results[index] = compressed;
      
      progress[index] = {
        fileName: file.name,
        originalSize: file.size,
        compressedSize: compressed.size,
        status: compressed === file ? 'skipped' : 'done',
        progress: 100,
      };
    } catch (error) {
      console.error(`Error compressing ${file.name}:`, error);
      results[index] = file;
      progress[index] = {
        ...progress[index],
        status: 'error',
      };
    }
    
    if (onProgress) onProgress([...progress]);
    
    // Process next file
    await processNext();
  };
  
  // Start concurrent workers
  const workers = Array(Math.min(concurrency, files.length))
    .fill(null)
    .map(() => processNext());
  
  await Promise.all(workers);
  
  return results;
}

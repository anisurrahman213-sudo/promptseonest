// Video frame extraction utility for better AI analysis

export interface FrameExtractionOptions {
  frameCount?: number;  // Number of frames to extract (default: 6)
  gridCols?: number;    // Columns in the grid (default: 3)
  frameWidth?: number;  // Width of each frame in grid (default: 640)
  quality?: number;     // JPEG quality 0-1 (default: 0.85)
}

const defaultOptions: FrameExtractionOptions = {
  frameCount: 6,
  gridCols: 3,
  frameWidth: 640,
  quality: 0.85,
};

/**
 * Extract a single frame from a video at a specific time
 */
function extractFrameAtTime(
  video: HTMLVideoElement,
  time: number,
  width: number,
  height: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    // Set up timeout for seeking
    const seekTimeout = setTimeout(() => {
      video.removeEventListener('seeked', handleSeeked);
      reject(new Error(`Seek timeout at ${time}s`));
    }, 5000);

    const handleSeeked = () => {
      clearTimeout(seekTimeout);
      video.removeEventListener('seeked', handleSeeked);
      
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        resolve(imageData);
      } catch (err) {
        reject(err);
      }
    };
    
    video.addEventListener('seeked', handleSeeked);
    video.currentTime = time;
  });
}

/**
 * Wait for video to be ready for frame extraction
 */
function waitForVideoReady(video: HTMLVideoElement, timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Video loading timeout'));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('error', handleError);
    };

    const handleLoaded = () => {
      // Ensure we have valid dimensions and duration
      if (video.videoWidth > 0 && video.videoHeight > 0 && video.duration > 0) {
        cleanup();
        resolve();
      }
    };

    const handleError = () => {
      cleanup();
      reject(new Error('Video failed to load'));
    };

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('error', handleError);

    // Check if already ready
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && video.duration > 0) {
      cleanup();
      resolve();
    }
  });
}

/**
 * Extract multiple frames from a video and combine them into a grid
 * This provides better context for AI analysis by showing different parts of the video
 */
export async function extractVideoFramesGrid(
  file: File,
  options: FrameExtractionOptions = {}
): Promise<string> {
  const opts = { ...defaultOptions, ...options };
  const { frameCount, gridCols, frameWidth, quality } = opts as Required<FrameExtractionOptions>;
  
  const video = document.createElement('video');
  const objectUrl = URL.createObjectURL(file);
  
  try {
    // Configure video element
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = objectUrl;
    
    // Trigger loading
    video.load();
    
    // Wait for video to be ready
    await waitForVideoReady(video);
    
    const duration = video.duration;
    
    // Validate duration
    if (!duration || duration === 0 || !isFinite(duration)) {
      throw new Error('Invalid video duration');
    }
    
    console.log(`📹 Processing video: ${file.name} (${formatTimestamp(duration)}, ${video.videoWidth}x${video.videoHeight})`);
    
    const aspectRatio = video.videoHeight / video.videoWidth;
    const frameHeight = Math.round(frameWidth * aspectRatio);
    
    // Calculate grid dimensions
    const gridRows = Math.ceil(frameCount / gridCols);
    const gridWidth = frameWidth * gridCols;
    const gridHeight = frameHeight * gridRows;
    
    // Create the grid canvas
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = gridWidth;
    gridCanvas.height = gridHeight;
    
    const gridCtx = gridCanvas.getContext('2d');
    if (!gridCtx) {
      throw new Error('Could not get grid canvas context');
    }
    
    // Fill background with dark color
    gridCtx.fillStyle = '#1a1a1a';
    gridCtx.fillRect(0, 0, gridWidth, gridHeight);
    
    // Calculate time points for frame extraction
    // Skip first and last 5% to avoid black frames
    const startTime = duration * 0.05;
    const endTime = duration * 0.95;
    const timeSpan = endTime - startTime;
    const timeStep = frameCount > 1 ? timeSpan / (frameCount - 1) : 0;
    
    // Extract frames at different time points
    let extractedFrames = 0;
    for (let i = 0; i < frameCount; i++) {
      const time = startTime + (timeStep * i);
      
      try {
        const imageData = await extractFrameAtTime(video, time, frameWidth, frameHeight);
        extractedFrames++;
        
        // Calculate position in grid
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        const x = col * frameWidth;
        const y = row * frameHeight;
        
        // Draw frame to grid
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frameWidth;
        tempCanvas.height = frameHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(imageData, 0, 0);
          gridCtx.drawImage(tempCanvas, x, y);
          
          // Add timestamp label
          gridCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          gridCtx.fillRect(x, y + frameHeight - 24, 70, 24);
          gridCtx.fillStyle = '#ffffff';
          gridCtx.font = 'bold 12px sans-serif';
          const timestamp = formatTimestamp(time);
          gridCtx.fillText(timestamp, x + 5, y + frameHeight - 8);
        }
      } catch (err) {
        console.warn(`Failed to extract frame at ${time}s:`, err);
      }
    }
    
    // If no frames extracted, reject
    if (extractedFrames === 0) {
      throw new Error('Could not extract any frames from video');
    }
    
    // Add video info header
    const headerHeight = 30;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = gridWidth;
    finalCanvas.height = gridHeight + headerHeight;
    
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) {
      throw new Error('Could not get final canvas context');
    }
    
    // Draw header
    finalCtx.fillStyle = '#2a2a2a';
    finalCtx.fillRect(0, 0, gridWidth, headerHeight);
    finalCtx.fillStyle = '#ffffff';
    finalCtx.font = 'bold 14px sans-serif';
    finalCtx.fillText(
      `Video: ${file.name} | Duration: ${formatTimestamp(duration)} | ${video.videoWidth}x${video.videoHeight}`,
      10,
      20
    );
    
    // Draw grid below header
    finalCtx.drawImage(gridCanvas, 0, headerHeight);
    
    // Convert to base64
    const dataUrl = finalCanvas.toDataURL('image/jpeg', quality);
    const base64 = dataUrl.split(',')[1];
    
    console.log(`✓ Extracted ${extractedFrames}/${frameCount} frames from video: ${file.name}`);
    return base64;
  } finally {
    // Always cleanup
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Format seconds to MM:SS format
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Legacy single frame extraction for backwards compatibility
 */
export async function extractSingleFrame(file: File): Promise<string> {
  const video = document.createElement('video');
  const objectUrl = URL.createObjectURL(file);
  
  try {
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = objectUrl;
    video.load();
    
    // Wait for video to be ready
    await waitForVideoReady(video, 15000);
    
    // Seek to 10% of video or 1 second, whichever is less
    const seekTime = Math.min(1, video.duration * 0.1);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        video.removeEventListener('seeked', handleSeeked);
        reject(new Error('Seek timeout'));
      }, 5000);

      const handleSeeked = () => {
        clearTimeout(timeout);
        video.removeEventListener('seeked', handleSeeked);
        resolve();
      };

      video.addEventListener('seeked', handleSeeked);
      video.currentTime = seekTime;
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];
    
    return base64;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

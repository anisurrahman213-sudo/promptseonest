// Video frame extraction utility for better AI analysis
// Optimized for fast extraction with 10x speed coverage

export interface FrameExtractionOptions {
  frameCount?: number;  // Number of frames to extract (default: 12 for 10x speed coverage)
  gridCols?: number;    // Columns in the grid (default: 4)
  frameWidth?: number;  // Width of each frame in grid (default: 480 for smaller size)
  quality?: number;     // JPEG quality 0-1 (default: 0.7 for compression)
  speedMultiplier?: number; // Speed multiplier for coverage (default: 10x)
}

const defaultOptions: FrameExtractionOptions = {
  frameCount: 12,      // More frames for better 10x coverage
  gridCols: 4,         // 4x3 grid layout
  frameWidth: 480,     // Smaller frames = smaller file size
  quality: 0.7,        // Lower quality = better compression
  speedMultiplier: 10, // 10x speed coverage
};

/**
 * Extract a single frame from a video at a specific time with timeout
 */
function extractFrameAtTime(
  video: HTMLVideoElement,
  time: number,
  width: number,
  height: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const seekTimeout = setTimeout(() => {
      video.removeEventListener('seeked', handleSeeked);
      reject(new Error(`Seek timeout at ${time}s`));
    }, 3000); // Faster timeout for 10x speed

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
function waitForVideoReady(video: HTMLVideoElement, timeout: number = 20000): Promise<void> {
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
 * Extract frames from video at 10x speed intervals
 * Covers entire video duration quickly for comprehensive AI analysis
 */
export async function extractVideoFramesGrid(
  file: File,
  options: FrameExtractionOptions = {}
): Promise<string> {
  const opts = { ...defaultOptions, ...options };
  const { frameCount, gridCols, frameWidth, quality, speedMultiplier } = opts as Required<FrameExtractionOptions>;
  
  const video = document.createElement('video');
  const objectUrl = URL.createObjectURL(file);
  
  const startTime = performance.now();
  
  try {
    // Configure video element for fast loading
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = objectUrl;
    video.load();
    
    // Wait for video to be ready
    await waitForVideoReady(video);
    
    const duration = video.duration;
    
    if (!duration || duration === 0 || !isFinite(duration)) {
      throw new Error('Invalid video duration');
    }
    
    console.log(`📹 Processing video at ${speedMultiplier}x: ${file.name} (${formatTimestamp(duration)}, ${video.videoWidth}x${video.videoHeight})`);
    
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
    
    // Fill background
    gridCtx.fillStyle = '#1a1a1a';
    gridCtx.fillRect(0, 0, gridWidth, gridHeight);
    
    // Calculate time points for 10x speed coverage
    // This means we sample across the entire video evenly
    const startOffset = duration * 0.02; // Skip first 2%
    const endOffset = duration * 0.98;   // Skip last 2%
    const timeSpan = endOffset - startOffset;
    const timeStep = frameCount > 1 ? timeSpan / (frameCount - 1) : 0;
    
    // Extract frames in parallel batches for speed
    let extractedFrames = 0;
    const framePromises: Promise<{ index: number; imageData: ImageData | null }>[] = [];
    
    for (let i = 0; i < frameCount; i++) {
      const time = startOffset + (timeStep * i);
      
      // Create a separate promise for each frame
      const framePromise = extractFrameAtTime(video, time, frameWidth, frameHeight)
        .then(imageData => ({ index: i, imageData }))
        .catch(err => {
          console.warn(`Frame ${i} at ${time.toFixed(1)}s failed:`, err.message);
          return { index: i, imageData: null };
        });
      
      framePromises.push(framePromise);
      
      // Wait after each frame (sequential seeking required)
      await framePromise;
    }
    
    // Draw all extracted frames to grid
    for (const result of await Promise.all(framePromises)) {
      if (result.imageData) {
        extractedFrames++;
        const i = result.index;
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        const x = col * frameWidth;
        const y = row * frameHeight;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frameWidth;
        tempCanvas.height = frameHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(result.imageData, 0, 0);
          gridCtx.drawImage(tempCanvas, x, y);
          
          // Add timestamp label
          const time = startOffset + (timeStep * i);
          gridCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          gridCtx.fillRect(x, y + frameHeight - 20, 55, 20);
          gridCtx.fillStyle = '#ffffff';
          gridCtx.font = 'bold 11px sans-serif';
          gridCtx.fillText(formatTimestamp(time), x + 4, y + frameHeight - 6);
        }
      }
    }
    
    if (extractedFrames === 0) {
      throw new Error('Could not extract any frames from video');
    }
    
    // Add compact video info header
    const headerHeight = 24;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = gridWidth;
    finalCanvas.height = gridHeight + headerHeight;
    
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) {
      throw new Error('Could not get final canvas context');
    }
    
    // Draw header with speed info
    finalCtx.fillStyle = '#2a2a2a';
    finalCtx.fillRect(0, 0, gridWidth, headerHeight);
    finalCtx.fillStyle = '#ffffff';
    finalCtx.font = 'bold 12px sans-serif';
    
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    finalCtx.fillText(
      `${file.name} | ${formatTimestamp(duration)} | ${video.videoWidth}x${video.videoHeight} | ${fileSizeMB}MB | ${speedMultiplier}x coverage`,
      8,
      16
    );
    
    // Draw grid below header
    finalCtx.drawImage(gridCanvas, 0, headerHeight);
    
    // Convert to base64 with compression
    const dataUrl = finalCanvas.toDataURL('image/jpeg', quality);
    const base64 = dataUrl.split(',')[1];
    
    const processingTime = ((performance.now() - startTime) / 1000).toFixed(1);
    const outputSizeKB = Math.round((base64.length * 0.75) / 1024);
    
    console.log(`✓ ${file.name}: ${extractedFrames}/${frameCount} frames extracted in ${processingTime}s (${outputSizeKB}KB output)`);
    
    return base64;
  } finally {
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
 * Quick single frame extraction for thumbnails
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
    
    await waitForVideoReady(video, 10000);
    
    const seekTime = Math.min(1, video.duration * 0.1);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        video.removeEventListener('seeked', handleSeeked);
        reject(new Error('Seek timeout'));
      }, 3000);

      const handleSeeked = () => {
        clearTimeout(timeout);
        video.removeEventListener('seeked', handleSeeked);
        resolve();
      };

      video.addEventListener('seeked', handleSeeked);
      video.currentTime = seekTime;
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth, 1280);
    canvas.height = Math.min(video.videoHeight, 720);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    
    return dataUrl.split(',')[1];
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Get video metadata without extracting frames
 */
export async function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}> {
  const video = document.createElement('video');
  const objectUrl = URL.createObjectURL(file);
  
  try {
    video.preload = 'metadata';
    video.src = objectUrl;
    video.load();
    
    await waitForVideoReady(video, 5000);
    
    return {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      aspectRatio: video.videoWidth / video.videoHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

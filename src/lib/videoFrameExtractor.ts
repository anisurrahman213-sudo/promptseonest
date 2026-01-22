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
    video.currentTime = time;
    
    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked);
      
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
    };
    
    video.addEventListener('seeked', handleSeeked);
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
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
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
          reject(new Error('Could not get grid canvas context'));
          return;
        }
        
        // Fill background with dark color
        gridCtx.fillStyle = '#1a1a1a';
        gridCtx.fillRect(0, 0, gridWidth, gridHeight);
        
        // Calculate time points for frame extraction
        // Skip first and last 5% to avoid black frames
        const startTime = duration * 0.05;
        const endTime = duration * 0.95;
        const timeSpan = endTime - startTime;
        const timeStep = timeSpan / (frameCount - 1);
        
        // Extract frames at different time points
        for (let i = 0; i < frameCount; i++) {
          const time = startTime + (timeStep * i);
          
          try {
            const imageData = await extractFrameAtTime(video, time, frameWidth, frameHeight);
            
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
        
        // Add video info header
        const headerHeight = 30;
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = gridWidth;
        finalCanvas.height = gridHeight + headerHeight;
        
        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) {
          reject(new Error('Could not get final canvas context'));
          return;
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
        
        URL.revokeObjectURL(video.src);
        
        console.log(`Extracted ${frameCount} frames from video: ${file.name} (${formatTimestamp(duration)})`);
        resolve(base64);
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
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
export function extractSingleFrame(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration * 0.1);
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      
      URL.revokeObjectURL(video.src);
      resolve(base64);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

import { Muxer, ArrayBufferTarget } from 'webm-muxer';

export interface WebCodecsCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  videoBitrate?: number; // kbps
  frameRate?: number;
  keyFrameInterval?: number; // seconds
}

const DEFAULT_OPTIONS: WebCodecsCompressionOptions = {
  maxWidth: 1280,
  maxHeight: 720,
  videoBitrate: 1000, // 1 Mbps
  frameRate: 30,
  keyFrameInterval: 2,
};

/**
 * Check if WebCodecs API is supported
 */
export function isWebCodecsSupported(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' &&
    typeof VideoDecoder !== 'undefined' &&
    typeof VideoFrame !== 'undefined'
  );
}

/**
 * Extract video metadata (duration, dimensions)
 */
async function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    
    const url = URL.createObjectURL(file);
    video.src = url;
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
  });
}

/**
 * Calculate target dimensions maintaining aspect ratio
 */
function calculateTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;
  
  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const aspectRatio = targetWidth / targetHeight;
    if (targetWidth > targetHeight) {
      targetWidth = Math.min(targetWidth, maxWidth);
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else {
      targetHeight = Math.min(targetHeight, maxHeight);
      targetWidth = Math.round(targetHeight * aspectRatio);
    }
  }
  
  // Ensure dimensions are even (required for video codecs)
  targetWidth = Math.floor(targetWidth / 2) * 2;
  targetHeight = Math.floor(targetHeight / 2) * 2;
  
  return { width: targetWidth, height: targetHeight };
}

/**
 * Extract frames from video at maximum speed using requestVideoFrameCallback
 */
async function extractFramesAtMaxSpeed(
  file: File,
  targetWidth: number,
  targetHeight: number,
  targetFrameRate: number,
  onFrame: (frame: VideoFrame, timestamp: number) => void,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    const url = URL.createObjectURL(file);
    video.src = url;
    
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d')!;
    
    let frameCount = 0;
    const frameDuration = 1 / targetFrameRate;
    let lastFrameTime = -frameDuration;
    
    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const totalFrames = Math.ceil(duration * targetFrameRate);
      
      // Use faster seeking approach
      video.playbackRate = 16; // Max speed
      video.currentTime = 0;
      
      const processFrame = async () => {
        const currentTime = video.currentTime;
        
        // Only capture at target frame rate intervals
        if (currentTime - lastFrameTime >= frameDuration * 0.9) {
          lastFrameTime = currentTime;
          
          // Draw to canvas and create VideoFrame
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          
          const timestamp = Math.round(currentTime * 1_000_000); // microseconds
          const frame = new VideoFrame(canvas, {
            timestamp,
            alpha: 'discard',
          });
          
          onFrame(frame, timestamp);
          frameCount++;
          
          if (onProgress) {
            onProgress(Math.min(currentTime / duration, 1));
          }
        }
        
        if (video.paused || video.ended || currentTime >= duration - 0.1) {
          URL.revokeObjectURL(url);
          console.log(`📊 Extracted ${frameCount} frames at ${targetFrameRate}fps`);
          resolve();
          return;
        }
        
        // Continue processing at max speed
        requestAnimationFrame(processFrame);
      };
      
      video.onplay = () => {
        requestAnimationFrame(processFrame);
      };
      
      video.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Video playback error'));
      };
      
      // Start playback at max speed
      try {
        await video.play();
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
}

/**
 * Compress video using WebCodecs API (5-10x faster than real-time)
 */
export async function compressVideoWithWebCodecs(
  file: File,
  options: WebCodecsCompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  
  // Skip if file is already small
  if (file.size < 5 * 1024 * 1024) {
    console.log(`⏭️ Video already small, skipping: ${file.name}`);
    return file;
  }
  
  console.log(`⚡ WebCodecs compression starting: ${file.name}`);
  
  try {
    // Get video metadata
    const metadata = await getVideoMetadata(file);
    const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
      metadata.width,
      metadata.height,
      opts.maxWidth!,
      opts.maxHeight!
    );
    
    console.log(`📐 ${metadata.width}x${metadata.height} → ${targetWidth}x${targetHeight}`);
    console.log(`⏱️ Duration: ${metadata.duration.toFixed(1)}s`);
    
    // Create muxer for WebM output
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'V_VP9',
        width: targetWidth,
        height: targetHeight,
        frameRate: opts.frameRate!,
      },
      firstTimestampBehavior: 'offset',
    });
    
    // Create video encoder
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta);
      },
      error: (e) => {
        console.error('VideoEncoder error:', e);
      },
    });
    
    // Configure encoder
    await encoder.configure({
      codec: 'vp09.00.10.08', // VP9 Profile 0, Level 1.0
      width: targetWidth,
      height: targetHeight,
      bitrate: opts.videoBitrate! * 1000,
      framerate: opts.frameRate!,
      latencyMode: 'quality',
      bitrateMode: 'variable',
    });
    
    let frameIndex = 0;
    const keyFrameInterval = opts.keyFrameInterval! * opts.frameRate!;
    
    // Extract and encode frames
    await extractFramesAtMaxSpeed(
      file,
      targetWidth,
      targetHeight,
      opts.frameRate!,
      (frame, timestamp) => {
        const isKeyFrame = frameIndex % keyFrameInterval === 0;
        encoder.encode(frame, { keyFrame: isKeyFrame });
        frame.close();
        frameIndex++;
      },
      onProgress
    );
    
    // Flush encoder and finalize
    await encoder.flush();
    encoder.close();
    muxer.finalize();
    
    // Get the compressed data
    const { buffer } = muxer.target as ArrayBufferTarget;
    const compressedBlob = new Blob([buffer], { type: 'video/webm' });
    
    // Generate filename
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const compressedFile = new File([compressedBlob], `${baseName}_compressed.webm`, {
      type: 'video/webm',
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const speedup = (metadata.duration / parseFloat(elapsed)).toFixed(1);
    const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
    
    console.log(`✅ WebCodecs: ${(file.size / (1024 * 1024)).toFixed(1)}MB → ${(compressedFile.size / (1024 * 1024)).toFixed(1)}MB (-${reduction}%)`);
    console.log(`⚡ ${elapsed}s (${speedup}x faster than real-time)`);
    
    // Return original if compressed is larger
    if (compressedFile.size >= file.size) {
      console.log('⚠️ Compressed larger than original, using original');
      return file;
    }
    
    return compressedFile;
  } catch (error) {
    console.error('WebCodecs compression failed:', error);
    throw error; // Let caller handle fallback
  }
}

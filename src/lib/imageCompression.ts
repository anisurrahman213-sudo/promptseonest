// Image compression utility for optimizing uploads
// Ultra-fast compression with parallel processing and OffscreenCanvas

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  aggressive?: boolean;
}

export interface CompressionProgress {
  fileName: string;
  status: 'pending' | 'compressing' | 'done' | 'skipped' | 'error';
  originalSize: number;
  compressedSize?: number;
  startTime?: number;
  endTime?: number;
  errorMessage?: string;
}

const defaultOptions: CompressionOptions = {
  maxWidth: 1400,
  maxHeight: 1400,
  quality: 0.5,
  maxSizeKB: 200,
  aggressive: true,
};

// Pre-calculate quality based on file size (no iterations needed)
function estimateQuality(fileSizeKB: number, targetSizeKB: number): number {
  if (fileSizeKB <= targetSizeKB) return 0.5;
  const ratio = targetSizeKB / fileSizeKB;
  return Math.max(0.15, Math.min(0.5, ratio * 0.8));
}

// Fast dimension calculation
function calculateDimensions(
  width: number, 
  height: number, 
  fileSizeKB: number, 
  maxDim: number
): { width: number; height: number } {
  // Aggressive resize for very large files
  let targetMaxDim = maxDim;
  if (fileSizeKB > 10000) targetMaxDim = 600;
  else if (fileSizeKB > 5000) targetMaxDim = 800;
  else if (fileSizeKB > 2000) targetMaxDim = 900;
  else if (fileSizeKB > 1000) targetMaxDim = 1024;

  if (width <= targetMaxDim && height <= targetMaxDim) {
    return { width, height };
  }

  const ratio = Math.min(targetMaxDim / width, targetMaxDim / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

// Use createImageBitmap for faster decoding
async function loadImageFast(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

// Single-pass compression using OffscreenCanvas when available
async function compressSinglePass(
  bitmap: ImageBitmap,
  targetWidth: number,
  targetHeight: number,
  quality: number
): Promise<Blob> {
  // Use OffscreenCanvas if available (much faster, runs off main thread)
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      return canvas.convertToBlob({ type: 'image/jpeg', quality });
    }
  }

  // Fallback to regular canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Blob creation failed')),
      'image/jpeg',
      quality
    );
  });
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...defaultOptions, ...options };
  const fileSizeKB = file.size / 1024;

  // Skip compression for non-image files or already small files
  if (!file.type.startsWith('image/') || fileSizeKB < 100) {
    return file;
  }

  // Skip vector formats
  if (
    file.type === 'image/svg+xml' ||
    file.type === 'application/postscript' ||
    file.type === 'image/x-eps'
  ) {
    return file;
  }

  try {
    // Fast image loading using createImageBitmap
    const bitmap = await loadImageFast(file);
    const { width: origW, height: origH } = bitmap;

    // Calculate target dimensions
    const { width, height } = calculateDimensions(origW, origH, fileSizeKB, opts.maxWidth!);

    // Pre-calculate optimal quality (no iteration)
    const quality = opts.aggressive 
      ? estimateQuality(fileSizeKB, opts.maxSizeKB!)
      : opts.quality!;

    // Single-pass compression
    const blob = await compressSinglePass(bitmap, width, height, quality);
    
    // Clean up bitmap
    bitmap.close();

    // Return original if compression didn't help
    if (blob.size >= file.size) {
      return file;
    }

    const compressedFile = new File([blob], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    const reduction = ((file.size - compressedFile.size) / file.size * 100).toFixed(0);
    console.log(
      `⚡ ${file.name}: ${(fileSizeKB).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (-${reduction}%) [${origW}x${origH} → ${width}x${height}]`
    );

    return compressedFile;
  } catch (error) {
    console.error('Compression error:', error);
    return file;
  }
}

// Ultra-fast parallel compression with high concurrency and progress tracking
export async function compressImages(
  files: File[],
  options?: CompressionOptions,
  concurrency: number = 20,
  onProgress?: (progress: CompressionProgress[]) => void
): Promise<File[]> {
  const results: File[] = new Array(files.length);
  
  // Initialize progress tracking
  const progressList: CompressionProgress[] = files.map(f => ({
    fileName: f.name,
    status: 'pending' as const,
    originalSize: f.size,
  }));
  
  const updateProgress = (index: number, update: Partial<CompressionProgress>) => {
    progressList[index] = { ...progressList[index], ...update };
    onProgress?.([...progressList]);
  };
  
  // Process all files with controlled concurrency using a semaphore pattern
  let activeCount = 0;
  let currentIndex = 0;
  
  return new Promise((resolve) => {
    const processNext = async () => {
      while (currentIndex < files.length && activeCount < concurrency) {
        const index = currentIndex++;
        const file = files[index];
        activeCount++;
        
        const startTime = Date.now();
        updateProgress(index, { status: 'compressing', startTime });
        
        compressImage(file, options)
          .then((result) => {
            results[index] = result;
            const wasSkipped = result === file && file.size / 1024 < 100;
            updateProgress(index, { 
              status: wasSkipped ? 'skipped' : 'done',
              compressedSize: result.size,
              endTime: Date.now()
            });
            activeCount--;
            
            if (currentIndex >= files.length && activeCount === 0) {
              resolve(results);
            } else {
              processNext();
            }
          })
          .catch((error) => {
            results[index] = file;
            updateProgress(index, { 
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Compression failed',
              endTime: Date.now()
            });
            activeCount--;
            processNext();
          });
      }
    };
    
    // Start initial batch
    processNext();
  });
}

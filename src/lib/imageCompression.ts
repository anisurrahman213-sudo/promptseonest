// Image compression utility for optimizing uploads
// Aggressive compression for fast uploads while maintaining quality

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number; // Target max size in KB
  aggressive?: boolean; // Enable aggressive compression
}

const defaultOptions: CompressionOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  maxSizeKB: 500, // Target 500KB max
  aggressive: true,
};

// Calculate optimal quality based on file size
function calculateOptimalQuality(currentSizeKB: number, targetSizeKB: number, currentQuality: number): number {
  const ratio = targetSizeKB / currentSizeKB;
  // Reduce quality proportionally, but not below 0.3
  return Math.max(0.3, Math.min(currentQuality * Math.sqrt(ratio), 0.9));
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...defaultOptions, ...options };
  const fileSizeKB = file.size / 1024;

  // Skip compression for non-image files or already small files
  if (!file.type.startsWith('image/') || fileSizeKB < 50) {
    return file;
  }

  // Skip SVG, EPS, and other vector formats
  if (
    file.type === 'image/svg+xml' ||
    file.type === 'application/postscript' ||
    file.type === 'image/x-eps'
  ) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = async () => {
      try {
        let { width, height } = img;
        const originalWidth = width;
        const originalHeight = height;

        // Calculate aggressive dimensions based on file size
        let targetMaxDim = opts.maxWidth!;
        
        if (opts.aggressive && fileSizeKB > opts.maxSizeKB!) {
          // For very large files, reduce dimensions more aggressively
          if (fileSizeKB > 5000) {
            targetMaxDim = Math.min(1600, opts.maxWidth!);
          } else if (fileSizeKB > 2000) {
            targetMaxDim = Math.min(1800, opts.maxWidth!);
          }
        }

        // Calculate new dimensions while maintaining aspect ratio
        if (width > targetMaxDim || height > targetMaxDim) {
          const ratio = Math.min(targetMaxDim / width, targetMaxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image with high-quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Determine initial quality based on file size
        let quality = opts.quality!;
        if (opts.aggressive && fileSizeKB > opts.maxSizeKB!) {
          quality = calculateOptimalQuality(fileSizeKB, opts.maxSizeKB!, quality);
        }

        // Iteratively compress to reach target size
        let attempts = 0;
        const maxAttempts = 5;
        let blob: Blob | null = null;
        
        const compressWithQuality = (q: number): Promise<Blob | null> => {
          return new Promise((res) => {
            canvas.toBlob((b) => res(b), 'image/jpeg', q);
          });
        };

        while (attempts < maxAttempts) {
          blob = await compressWithQuality(quality);
          
          if (!blob) {
            resolve(file);
            return;
          }

          const blobSizeKB = blob.size / 1024;
          
          // If we're within target or quality is too low, stop
          if (blobSizeKB <= opts.maxSizeKB! || quality <= 0.3) {
            break;
          }
          
          // Reduce quality for next attempt
          quality = calculateOptimalQuality(blobSizeKB, opts.maxSizeKB!, quality);
          attempts++;
        }

        if (!blob) {
          resolve(file);
          return;
        }

        // If compressed file is larger than original, return original
        if (blob.size >= file.size) {
          resolve(file);
          return;
        }

        // Create new file with same name
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        const reduction = ((file.size - compressedFile.size) / file.size * 100).toFixed(0);
        console.log(
          `✓ Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (-${reduction}%) | ${originalWidth}x${originalHeight} → ${width}x${height}`
        );

        resolve(compressedFile);
      } catch (error) {
        console.error('Compression error:', error);
        resolve(file);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image for compression');
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
}

// Compress multiple images in parallel with concurrency control
export async function compressImages(
  files: File[],
  options?: CompressionOptions,
  concurrency: number = 5
): Promise<File[]> {
  const results: File[] = [];
  
  // Process in batches for better performance
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((file) => compressImage(file, options))
    );
    results.push(...batchResults);
  }
  
  return results;
}

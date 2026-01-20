// Image compression utility for optimizing uploads

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const defaultOptions: CompressionOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  maxSizeMB: 2,
};

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...defaultOptions, ...options };

  // Skip compression for non-image files or small files
  if (!file.type.startsWith('image/') || file.size < 100 * 1024) {
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

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          const ratio = Math.min(
            opts.maxWidth! / width,
            opts.maxHeight! / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // If compressed file is larger, return original
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }

            // Create new file with same name
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log(
              `Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`
            );

            resolve(compressedFile);
          },
          'image/jpeg',
          opts.quality
        );
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

export async function compressImages(
  files: File[],
  options?: CompressionOptions
): Promise<File[]> {
  const results = await Promise.all(
    files.map((file) => compressImage(file, options))
  );
  return results;
}

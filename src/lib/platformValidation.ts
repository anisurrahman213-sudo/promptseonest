// Platform validation utilities for image requirements
import type { ExportPlatform } from '@/components/dashboard/AdvancedMetadataControls';

export interface PlatformRequirements {
  name: string;
  icon: string;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  minFileSize: number; // bytes
  maxFileSize: number; // bytes
  formats: string[];
  aiContentAllowed: boolean;
}

const parseSize = (size: string): number => {
  const match = size.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  switch (unit) {
    case 'KB': return value * 1024;
    case 'MB': return value * 1024 * 1024;
    case 'GB': return value * 1024 * 1024 * 1024;
    default: return value;
  }
};

export const platformRequirements: Record<ExportPlatform, PlatformRequirements> = {
  adobe_stock: {
    name: 'Adobe Stock',
    icon: '🎨',
    minWidth: 2000,
    minHeight: 2000,
    maxWidth: 10000,
    maxHeight: 10000,
    minFileSize: parseSize('300KB'),
    maxFileSize: parseSize('45MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: true,
  },
  shutterstock: {
    name: 'Shutterstock',
    icon: '📷',
    minWidth: 2000,
    minHeight: 2000,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('100KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: true,
  },
  istock: {
    name: 'iStock',
    icon: '📸',
    minWidth: 1600,
    minHeight: 1200,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('500KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg'],
    aiContentAllowed: false,
  },
  getty: {
    name: 'Getty Images',
    icon: '🖼️',
    minWidth: 3000,
    minHeight: 2000,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('1MB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/tiff'],
    aiContentAllowed: false,
  },
  alamy: {
    name: 'Alamy',
    icon: '🏞️',
    minWidth: 4200,
    minHeight: 4100,
    maxWidth: 50000,
    maxHeight: 50000,
    minFileSize: parseSize('1MB'),
    maxFileSize: parseSize('200MB'),
    formats: ['image/jpeg', 'image/tiff'],
    aiContentAllowed: true,
  },
  dreamstime: {
    name: 'Dreamstime',
    icon: '💭',
    minWidth: 1732,
    minHeight: 1732,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('256KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: true,
  },
  '123rf': {
    name: '123RF',
    icon: '🔢',
    minWidth: 2000,
    minHeight: 2000,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('500KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: true,
  },
  depositphotos: {
    name: 'Depositphotos',
    icon: '📥',
    minWidth: 2025,
    minHeight: 2025,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('500KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: true,
  },
  canva: {
    name: 'Canva Creators',
    icon: '🎯',
    minWidth: 1500,
    minHeight: 1500,
    maxWidth: 5000,
    maxHeight: 5000,
    minFileSize: parseSize('100KB'),
    maxFileSize: parseSize('25MB'),
    formats: ['image/jpeg', 'image/png', 'image/svg+xml'],
    aiContentAllowed: true,
  },
  freepik: {
    name: 'Freepik',
    icon: '✨',
    minWidth: 2000,
    minHeight: 2000,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('500KB'),
    maxFileSize: parseSize('100MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: true,
  },
  vecteezy: {
    name: 'Vecteezy',
    icon: '🎭',
    minWidth: 1500,
    minHeight: 1500,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('256KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/png', 'image/svg+xml'],
    aiContentAllowed: true,
  },
  picfair: {
    name: 'Picfair',
    icon: '🖌️',
    minWidth: 1000,
    minHeight: 1000,
    maxWidth: 50000,
    maxHeight: 50000,
    minFileSize: parseSize('256KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: false,
  },
  eyeem: {
    name: 'EyeEm',
    icon: '👁️',
    minWidth: 2000,
    minHeight: 2000,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('500KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg'],
    aiContentAllowed: false,
  },
  rawpixel: {
    name: 'Rawpixel',
    icon: '📦',
    minWidth: 2000,
    minHeight: 2000,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('500KB'),
    maxFileSize: parseSize('100MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: true,
  },
  stocksy: {
    name: 'Stocksy',
    icon: '💎',
    minWidth: 4500,
    minHeight: 3000,
    maxWidth: 50000,
    maxHeight: 50000,
    minFileSize: parseSize('1MB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/tiff'],
    aiContentAllowed: false,
  },
  twenty20: {
    name: 'Twenty20',
    icon: '🔷',
    minWidth: 2048,
    minHeight: 2048,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('500KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: true,
  },
  wirestock: {
    name: 'Wirestock',
    icon: '🌐',
    minWidth: 2000,
    minHeight: 2000,
    maxWidth: 7071,
    maxHeight: 7071,
    minFileSize: parseSize('500KB'),
    maxFileSize: parseSize('50MB'),
    formats: ['image/jpeg', 'image/png'],
    aiContentAllowed: true,
  },
   pond5: {
     name: 'Pond5',
     icon: '🎬',
     minWidth: 1920,
     minHeight: 1080,
     maxWidth: 7680,
     maxHeight: 4320,
     minFileSize: parseSize('1MB'),
     maxFileSize: parseSize('100MB'),
     formats: ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'],
     aiContentAllowed: true,
   },
   storyblocks: {
     name: 'Storyblocks',
     icon: '📹',
     minWidth: 1920,
     minHeight: 1080,
     maxWidth: 7680,
     maxHeight: 4320,
     minFileSize: parseSize('500KB'),
     maxFileSize: parseSize('500MB'),
     formats: ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'],
     aiContentAllowed: true,
   },
  custom: {
    name: 'Custom',
    icon: '⚙️',
    minWidth: 0,
    minHeight: 0,
    maxWidth: 50000,
    maxHeight: 50000,
    minFileSize: 0,
    maxFileSize: parseSize('500MB'),
    formats: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/tiff'],
    aiContentAllowed: true,
  },
};

export interface ValidationResult {
  isValid: boolean;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    value?: string;
    required?: string;
  }[];
}

export interface ImageInfo {
  width: number;
  height: number;
  fileSize: number;
  format: string;
  fileName: string;
}

export const getImageInfo = (file: File): Promise<ImageInfo> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileSize: file.size,
        format: file.type,
        fileName: file.name,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatMimeType = (mimeType: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/svg+xml': 'SVG',
    'image/tiff': 'TIFF',
  };
  return map[mimeType] || mimeType;
};

export const validateImage = (
  imageInfo: ImageInfo,
  platform: ExportPlatform
): ValidationResult => {
  const req = platformRequirements[platform];
  const checks: ValidationResult['checks'] = [];

  // Resolution check (min)
  const megapixels = (imageInfo.width * imageInfo.height) / 1000000;
  const minMegapixels = (req.minWidth * req.minHeight) / 1000000;
  const meetsMinRes = imageInfo.width >= req.minWidth || imageInfo.height >= req.minHeight;
  
  checks.push({
    name: 'Minimum Resolution',
    passed: meetsMinRes,
    message: meetsMinRes 
      ? `Resolution meets minimum requirement`
      : `Resolution too low`,
    value: `${imageInfo.width}×${imageInfo.height} (${megapixels.toFixed(1)}MP)`,
    required: `${req.minWidth}×${req.minHeight} (${minMegapixels.toFixed(1)}MP)`,
  });

  // Resolution check (max)
  const meetsMaxRes = imageInfo.width <= req.maxWidth && imageInfo.height <= req.maxHeight;
  if (!meetsMaxRes) {
    checks.push({
      name: 'Maximum Resolution',
      passed: false,
      message: `Resolution exceeds maximum`,
      value: `${imageInfo.width}×${imageInfo.height}`,
      required: `Max ${req.maxWidth}×${req.maxHeight}`,
    });
  }

  // File size check (min)
  const meetsMinSize = imageInfo.fileSize >= req.minFileSize;
  checks.push({
    name: 'Minimum File Size',
    passed: meetsMinSize,
    message: meetsMinSize ? 'File size meets minimum' : 'File too small',
    value: formatBytes(imageInfo.fileSize),
    required: formatBytes(req.minFileSize),
  });

  // File size check (max)
  const meetsMaxSize = imageInfo.fileSize <= req.maxFileSize;
  checks.push({
    name: 'Maximum File Size',
    passed: meetsMaxSize,
    message: meetsMaxSize ? 'File size within limit' : 'File too large',
    value: formatBytes(imageInfo.fileSize),
    required: `Max ${formatBytes(req.maxFileSize)}`,
  });

  // Format check
  const formatSupported = req.formats.includes(imageInfo.format);
  checks.push({
    name: 'File Format',
    passed: formatSupported,
    message: formatSupported ? 'Format supported' : 'Format not supported',
    value: formatMimeType(imageInfo.format),
    required: req.formats.map(f => formatMimeType(f)).join(', '),
  });

  // AI content warning (info only)
  if (!req.aiContentAllowed) {
    checks.push({
      name: 'AI Content Policy',
      passed: false,
      message: 'AI-generated content NOT accepted on this platform',
      value: 'Warning',
      required: 'Non-AI content only',
    });
  }

  const isValid = checks.filter(c => c.name !== 'AI Content Policy').every(c => c.passed);

  return { isValid, checks };
};

export const validateMultipleImages = async (
  files: File[],
  platform: ExportPlatform
): Promise<{ fileName: string; info: ImageInfo; validation: ValidationResult }[]> => {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const info = await getImageInfo(file);
        const validation = validateImage(info, platform);
        return { fileName: file.name, info, validation };
      } catch (error) {
        return {
          fileName: file.name,
          info: { width: 0, height: 0, fileSize: file.size, format: file.type, fileName: file.name },
          validation: {
            isValid: false,
            checks: [{ name: 'File Read', passed: false, message: 'Failed to read image' }],
          },
        };
      }
    })
  );
  return results;
};

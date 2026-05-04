// User-friendly error messages for upload + AI processing pipeline
// Maps raw errors/codes from edge functions and storage into clear, actionable text.

export type UploadErrorCategory =
  | 'rate_limit'
  | 'file_too_large'
  | 'file_too_small'
  | 'invalid_image'
  | 'decode_failed'
  | 'ai_failed'
  | 'ai_key_invalid'
  | 'ai_quota'
  | 'ai_truncated'
  | 'network'
  | 'storage'
  | 'credits'
  | 'save_failed'
  | 'unknown';

export interface FriendlyError {
  category: UploadErrorCategory;
  message: string;   // short, shown inline
  hint?: string;     // optional follow-up tip
}

interface MapErrorInput {
  code?: string;
  rawMessage?: string;
  status?: number;
  context?: 'upload' | 'analyze' | 'save' | 'credit';
}

const TEMPLATES: Record<UploadErrorCategory, FriendlyError> = {
  rate_limit: {
    category: 'rate_limit',
    message: 'AI rate limit reached',
    hint: 'Too many requests at once. Please wait a few seconds and retry.',
  },
  file_too_large: {
    category: 'file_too_large',
    message: 'File too large',
    hint: 'Image must be under 100MB. Compress or resize it first.',
  },
  file_too_small: {
    category: 'file_too_small',
    message: 'File too small',
    hint: 'Image must be at least 1KB.',
  },
  invalid_image: {
    category: 'invalid_image',
    message: 'Invalid image format',
    hint: 'Use JPG, PNG, WEBP, SVG, or EPS. The file may be corrupted.',
  },
  decode_failed: {
    category: 'decode_failed',
    message: 'Could not read image',
    hint: 'The image is damaged or unsupported. Try a different file.',
  },
  ai_failed: {
    category: 'ai_failed',
    message: 'AI analysis failed',
    hint: 'The AI service had trouble. Please retry this file.',
  },
  ai_key_invalid: {
    category: 'ai_key_invalid',
    message: 'AI service unavailable',
    hint: 'API configuration issue. Contact support if this persists.',
  },
  ai_quota: {
    category: 'ai_quota',
    message: 'AI quota exceeded',
    hint: 'Daily AI limit reached. Try again later.',
  },
  ai_truncated: {
    category: 'ai_truncated',
    message: 'AI response cut off',
    hint: 'The image was too complex. Please retry.',
  },
  network: {
    category: 'network',
    message: 'Network error',
    hint: 'Check your internet connection and retry.',
  },
  storage: {
    category: 'storage',
    message: 'Upload to storage failed',
    hint: 'The file could not be saved. Please retry.',
  },
  credits: {
    category: 'credits',
    message: 'Not enough credits',
    hint: 'Top up your credits to continue processing.',
  },
  save_failed: {
    category: 'save_failed',
    message: 'Could not save result',
    hint: 'Database write failed. Please retry.',
  },
  unknown: {
    category: 'unknown',
    message: 'Processing failed',
    hint: 'Something went wrong. Please retry this file.',
  },
};

export function mapUploadError(input: MapErrorInput): FriendlyError {
  const code = (input.code || '').toUpperCase();
  const raw = (input.rawMessage || '').toLowerCase();
  const status = input.status;

  // Code-based mapping (highest priority — comes from edge function)
  if (code === 'RATE_LIMITED') return TEMPLATES.rate_limit;
  if (code === 'GEMINI_KEY_INVALID') return TEMPLATES.ai_key_invalid;
  if (code === 'AI_CREDITS_EXHAUSTED') return TEMPLATES.ai_quota;
  if (code === 'MAX_TOKENS') return TEMPLATES.ai_truncated;
  if (code === 'AI_PROCESSING_FAILED') return TEMPLATES.ai_failed;

  // Status-based mapping
  if (status === 429) return TEMPLATES.rate_limit;
  if (status === 413) return TEMPLATES.file_too_large;
  if (status && status >= 500) return TEMPLATES.ai_failed;

  // Raw message keyword matching
  if (raw.includes('rate limit') || raw.includes('quota exceeded') || raw.includes('429')) {
    return TEMPLATES.rate_limit;
  }
  if (raw.includes('too large') || raw.includes('payload') || raw.includes('exceeded the maximum')) {
    return TEMPLATES.file_too_large;
  }
  if (raw.includes('too small') || raw.includes('at least')) {
    return TEMPLATES.file_too_small;
  }
  if (raw.includes('invalid image') || raw.includes('invalid image data') || raw.includes('unsupported')) {
    return TEMPLATES.invalid_image;
  }
  if (raw.includes('decode') || raw.includes('could not read') || raw.includes('corrupt')) {
    return TEMPLATES.decode_failed;
  }
  if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('connection')) {
    return TEMPLATES.network;
  }
  if (raw.includes('upload failed') || raw.includes('storage')) {
    return TEMPLATES.storage;
  }
  if (raw.includes('credit') || raw.includes('insufficient')) {
    return TEMPLATES.credits;
  }
  if (raw.includes('save') || raw.includes('database') || raw.includes('insert')) {
    return TEMPLATES.save_failed;
  }
  if (raw.includes('parse') || raw.includes('truncated')) {
    return TEMPLATES.ai_truncated;
  }
  if (raw.includes('ai') || raw.includes('gemini') || raw.includes('analysis')) {
    return TEMPLATES.ai_failed;
  }

  // Context fallback
  if (input.context === 'upload') return TEMPLATES.storage;
  if (input.context === 'analyze') return TEMPLATES.ai_failed;
  if (input.context === 'save') return TEMPLATES.save_failed;
  if (input.context === 'credit') return TEMPLATES.credits;

  return TEMPLATES.unknown;
}

export function formatErrorForDisplay(err: FriendlyError): string {
  return err.hint ? `${err.message} — ${err.hint}` : err.message;
}

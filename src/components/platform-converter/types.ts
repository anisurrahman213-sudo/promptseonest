export type SourcePlatform = 'adobe_stock' | 'shutterstock' | 'freepik';

export interface PlatformResult {
  title: string;
  keywords: string[];
  description: string;
  score: number;
}

export interface ConversionResult {
  adobe_stock: PlatformResult;
  shutterstock: PlatformResult;
  freepik: PlatformResult;
  changes_made: {
    shutterstock: string[];
    freepik: string[];
  };
}

export const PLATFORM_CONFIG = [
  { key: 'adobe_stock' as const, label: 'Adobe Stock', icon: '🅰️', color: 'border-red-500/40 bg-red-500/5', badge: 'bg-red-500/15 text-red-500', maxTitle: 70, maxKw: 49, descRange: '200–500' },
  { key: 'shutterstock' as const, label: 'Shutterstock', icon: '🔴', color: 'border-orange-500/40 bg-orange-500/5', badge: 'bg-orange-500/15 text-orange-500', maxTitle: 200, maxKw: 50, descRange: '≤200' },
  { key: 'freepik' as const, label: 'Freepik', icon: '🟡', color: 'border-blue-500/40 bg-blue-500/5', badge: 'bg-blue-500/15 text-blue-500', maxTitle: 100, maxKw: 30, descRange: '100–300' },
] as const;

export interface BulkRow {
  index: number;
  title: string;
  keywords: string;
  description: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: ConversionResult;
  error?: string;
}

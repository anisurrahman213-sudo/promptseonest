import { motion } from 'framer-motion';
import { Check, AlertCircle, Image, FileType, Ruler, Hash, FileText, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ExportPlatform } from './AdvancedMetadataControls';

interface PlatformRequirement {
  name: string;
  icon: string;
  minResolution: string;
  maxResolution: string;
  minFileSize: string;
  maxFileSize: string;
  formats: string[];
  titleLimit: number;
  descriptionLimit: number;
  keywordsLimit: number;
  additionalNotes: string[];
  modelRelease: boolean;
  propertyRelease: boolean;
  aiContentAllowed: boolean;
}

const platformRequirements: Record<ExportPlatform, PlatformRequirement> = {
  adobe_stock: {
    name: 'Adobe Stock',
    icon: '🎨',
    minResolution: '4MP (2000x2000)',
    maxResolution: '100MP',
    minFileSize: '300KB',
    maxFileSize: '45MB',
    formats: ['JPEG', 'PNG', 'EPS', 'AI', 'SVG'],
    titleLimit: 200,
    descriptionLimit: 0,
    keywordsLimit: 49,
    additionalNotes: [
      'CSV column names must match exactly in English',
      'If column name not recognized, it will be ignored',
      'All values except Filename are optional',
      'CSV max 5000 rows or 5MB',
      'Upload images FIRST, then CSV file',
      'Filename must match exactly with uploaded asset'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  shutterstock: {
    name: 'Shutterstock',
    icon: '📷',
    minResolution: '4MP',
    maxResolution: '50MP',
    minFileSize: '100KB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'PNG', 'EPS', 'AI'],
    titleLimit: 200,
    descriptionLimit: 200,
    keywordsLimit: 50,
    additionalNotes: [
      'Minimum 4 megapixels',
      'JPEG quality 80% or higher',
      'No trademarked content'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  istock: {
    name: 'iStock',
    icon: '📸',
    minResolution: '1600x1200',
    maxResolution: '50MP',
    minFileSize: '500KB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'EPS', 'AI'],
    titleLimit: 100,
    descriptionLimit: 200,
    keywordsLimit: 50,
    additionalNotes: [
      'Part of Getty Images',
      'Exclusive content gets higher royalties',
      'High editorial standards'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: false
  },
  getty: {
    name: 'Getty Images',
    icon: '🖼️',
    minResolution: '3000x2000',
    maxResolution: '50MP',
    minFileSize: '1MB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'TIFF'],
    titleLimit: 250,
    descriptionLimit: 2000,
    keywordsLimit: 50,
    additionalNotes: [
      'Premium quality required',
      'Exclusive and non-exclusive options',
      'Higher editorial standards'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: false
  },
  alamy: {
    name: 'Alamy',
    icon: '🏞️',
    minResolution: '17MP (4200x4100)',
    maxResolution: 'Unlimited',
    minFileSize: '1MB',
    maxFileSize: '200MB',
    formats: ['JPEG', 'TIFF'],
    titleLimit: 255,
    descriptionLimit: 1000,
    keywordsLimit: 50,
    additionalNotes: [
      'Non-exclusive by default',
      '50% royalty rate',
      'One of the largest stock libraries'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  dreamstime: {
    name: 'Dreamstime',
    icon: '💭',
    minResolution: '3MP',
    maxResolution: '50MP',
    minFileSize: '256KB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'PNG', 'EPS', 'AI', 'PSD'],
    titleLimit: 100,
    descriptionLimit: 200,
    keywordsLimit: 50,
    additionalNotes: [
      'Level-based royalty system',
      'Referral program available',
      'Both exclusive and non-exclusive'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  '123rf': {
    name: '123RF',
    icon: '🔢',
    minResolution: '4MP',
    maxResolution: '50MP',
    minFileSize: '500KB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'PNG', 'EPS', 'AI'],
    titleLimit: 150,
    descriptionLimit: 200,
    keywordsLimit: 50,
    additionalNotes: [
      'Fast approval process',
      'Multiple pricing tiers',
      'Weekly payouts available'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  depositphotos: {
    name: 'Depositphotos',
    icon: '📥',
    minResolution: '4.1MP',
    maxResolution: '50MP',
    minFileSize: '500KB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'PNG', 'EPS', 'AI'],
    titleLimit: 200,
    descriptionLimit: 200,
    keywordsLimit: 50,
    additionalNotes: [
      '34-42% royalty rates',
      'Non-exclusive by default',
      'Fast review process'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  canva: {
    name: 'Canva Creators',
    icon: '🎯',
    minResolution: '1500x1500',
    maxResolution: '25MP',
    minFileSize: '100KB',
    maxFileSize: '25MB',
    formats: ['JPEG', 'PNG', 'SVG'],
    titleLimit: 100,
    descriptionLimit: 250,
    keywordsLimit: 25,
    additionalNotes: [
      'Royalty per use model',
      'Templates and elements accepted',
      'Growing platform'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  freepik: {
    name: 'Freepik',
    icon: '✨',
    minResolution: '2000x2000',
    maxResolution: '50MP',
    minFileSize: '500KB',
    maxFileSize: '100MB',
    formats: ['JPEG', 'PNG', 'EPS', 'AI', 'PSD'],
    titleLimit: 100,
    descriptionLimit: 200,
    keywordsLimit: 50,
    additionalNotes: [
      'Vectors and PSD highly valued',
      'Exclusive contributor program',
      'Monthly earnings bonuses'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  vecteezy: {
    name: 'Vecteezy',
    icon: '🎭',
    minResolution: '1500x1500',
    maxResolution: '50MP',
    minFileSize: '256KB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'PNG', 'EPS', 'AI', 'SVG'],
    titleLimit: 100,
    descriptionLimit: 200,
    keywordsLimit: 50,
    additionalNotes: [
      'Focus on vectors',
      'Pro contributor program',
      'Revenue share model'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  picfair: {
    name: 'Picfair',
    icon: '🖌️',
    minResolution: '1000x1000',
    maxResolution: 'Unlimited',
    minFileSize: '256KB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'PNG'],
    titleLimit: 100,
    descriptionLimit: 500,
    keywordsLimit: 30,
    additionalNotes: [
      'Set your own prices',
      'Keep 100% of markup',
      'Personal storefront included'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: false
  },
  eyeem: {
    name: 'EyeEm',
    icon: '👁️',
    minResolution: '2000x2000',
    maxResolution: '50MP',
    minFileSize: '500KB',
    maxFileSize: '50MB',
    formats: ['JPEG'],
    titleLimit: 100,
    descriptionLimit: 200,
    keywordsLimit: 50,
    additionalNotes: [
      'Partnered with Getty',
      'Mobile-friendly submissions',
      'Community features'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: false
  },
  rawpixel: {
    name: 'Rawpixel',
    icon: '📦',
    minResolution: '2000x2000',
    maxResolution: '50MP',
    minFileSize: '500KB',
    maxFileSize: '100MB',
    formats: ['JPEG', 'PNG', 'PSD', 'AI'],
    titleLimit: 150,
    descriptionLimit: 300,
    keywordsLimit: 50,
    additionalNotes: [
      'Focus on authentic imagery',
      'Public domain resources',
      'Creative community'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  stocksy: {
    name: 'Stocksy',
    icon: '💎',
    minResolution: '4500px (long edge)',
    maxResolution: 'Unlimited',
    minFileSize: '1MB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'TIFF'],
    titleLimit: 200,
    descriptionLimit: 500,
    keywordsLimit: 50,
    additionalNotes: [
      'Curated and exclusive',
      '50-75% royalty rates',
      'Co-op model - artists are owners'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: false
  },
  twenty20: {
    name: 'Twenty20',
    icon: '🔷',
    minResolution: '2048x2048',
    maxResolution: '50MP',
    minFileSize: '500KB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'PNG'],
    titleLimit: 100,
    descriptionLimit: 200,
    keywordsLimit: 30,
    additionalNotes: [
      'Part of Envato Elements',
      'Photo challenges',
      'Mobile upload friendly'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
  wirestock: {
    name: 'Wirestock',
    icon: '🌐',
    minResolution: '4MP',
    maxResolution: '50MP',
    minFileSize: '500KB',
    maxFileSize: '50MB',
    formats: ['JPEG', 'PNG', 'EPS', 'AI'],
    titleLimit: 200,
    descriptionLimit: 200,
    keywordsLimit: 50,
    additionalNotes: [
      'Distributes to multiple agencies',
      'One upload, multiple platforms',
      'AI keywording included'
    ],
    modelRelease: true,
    propertyRelease: true,
    aiContentAllowed: true
  },
   pond5: {
     name: 'Pond5',
     icon: '🎬',
     minResolution: '1920x1080 (HD)',
     maxResolution: '4K+',
     minFileSize: '1MB',
     maxFileSize: '100GB',
     formats: ['MOV', 'MP4', 'JPEG', 'PNG', 'AE'],
     titleLimit: 100,
     descriptionLimit: 500,
     keywordsLimit: 50,
     additionalNotes: [
       'Best for video content',
       'Set your own prices',
       'After Effects templates accepted'
     ],
     modelRelease: true,
     propertyRelease: true,
     aiContentAllowed: true
   },
   storyblocks: {
     name: 'Storyblocks',
     icon: '📹',
     minResolution: '1920x1080 (HD)',
     maxResolution: '4K+',
     minFileSize: '500KB',
     maxFileSize: '4GB',
     formats: ['MOV', 'MP4', 'JPEG', 'PNG', 'WAV', 'MP3'],
     titleLimit: 100,
     descriptionLimit: 300,
     keywordsLimit: 50,
     additionalNotes: [
       'Video, audio, and images',
       'Subscription-based platform',
       'Royalty-free licensing'
     ],
     modelRelease: true,
     propertyRelease: true,
     aiContentAllowed: true
   },
  custom: {
    name: 'Custom',
    icon: '⚙️',
    minResolution: 'Any',
    maxResolution: 'Any',
    minFileSize: 'Any',
    maxFileSize: 'Any',
    formats: ['All formats'],
    titleLimit: 200,
    descriptionLimit: 500,
    keywordsLimit: 50,
    additionalNotes: [
      'Custom settings for your needs',
      'No platform restrictions',
      'Flexible output'
    ],
    modelRelease: false,
    propertyRelease: false,
    aiContentAllowed: true
  }
};

interface PlatformChecklistProps {
  platform: ExportPlatform;
}

export function PlatformChecklist({ platform }: PlatformChecklistProps) {
  const req = platformRequirements[platform];
  
  if (!req) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{req.icon}</span>
        <h4 className="font-semibold text-foreground">{req.name} Requirements</h4>
      </div>

      {/* Grid of requirements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Resolution */}
        <div className="flex items-start gap-2 p-2 rounded-md bg-background/50">
          <Ruler className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Resolution</p>
            <p className="text-sm text-foreground">{req.minResolution} - {req.maxResolution}</p>
          </div>
        </div>

        {/* File Size */}
        <div className="flex items-start gap-2 p-2 rounded-md bg-background/50">
          <FileType className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">File Size</p>
            <p className="text-sm text-foreground">{req.minFileSize} - {req.maxFileSize}</p>
          </div>
        </div>

        {/* Formats */}
        <div className="flex items-start gap-2 p-2 rounded-md bg-background/50">
          <Image className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Formats</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {req.formats.map((format) => (
                <Badge key={format} variant="secondary" className="text-xs px-1.5 py-0">
                  {format}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Metadata Limits */}
        <div className="flex items-start gap-2 p-2 rounded-md bg-background/50">
          <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Metadata Limits</p>
            <p className="text-sm text-foreground">
              Title: {req.titleLimit} • Desc: {req.descriptionLimit}
            </p>
          </div>
        </div>

        {/* Keywords */}
        <div className="flex items-start gap-2 p-2 rounded-md bg-background/50">
          <Hash className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Keywords Limit</p>
            <p className="text-sm text-foreground">{req.keywordsLimit} keywords max</p>
          </div>
        </div>

        {/* Releases */}
        <div className="flex items-start gap-2 p-2 rounded-md bg-background/50">
          <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Releases Required</p>
            <div className="flex gap-2 mt-1">
              <Badge variant={req.modelRelease ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                Model
              </Badge>
              <Badge variant={req.propertyRelease ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                Property
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* AI Content Status */}
      <div className={`flex items-center gap-2 p-2 rounded-md ${req.aiContentAllowed ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
        {req.aiContentAllowed ? (
          <Check className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
        )}
        <p className={`text-sm font-medium ${req.aiContentAllowed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {req.aiContentAllowed ? 'AI-generated content accepted' : 'AI-generated content NOT accepted'}
        </p>
      </div>

      {/* Additional Notes */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Additional Notes:</p>
        <ul className="space-y-1">
          {req.additionalNotes.map((note, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export { platformRequirements };

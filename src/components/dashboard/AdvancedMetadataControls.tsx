import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings2, Info, RotateCcw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { PlatformChecklist } from './PlatformChecklist';
export type ExportPlatform = 
  | 'adobe_stock' 
  | 'shutterstock' 
  | 'istock' 
  | 'getty' 
  | 'alamy' 
  | 'dreamstime' 
  | '123rf' 
  | 'depositphotos' 
  | 'canva' 
  | 'freepik' 
  | 'vecteezy' 
  | 'picfair' 
  | 'eyeem' 
  | 'rawpixel' 
  | 'stocksy' 
  | 'twenty20' 
  | 'wirestock'
   | 'pond5'
   | 'storyblocks'
  | 'custom';

export type ImageType = 'none' | 'photo' | 'illustration' | 'vector' | '3d_render' | 'ai_generated';

export interface MetadataSettings {
  exportPlatform: ExportPlatform;
  titleLength: number;
  titleLengthMix: boolean;
  descriptionLength: number;
  descriptionLengthFixed: boolean;
  keywordsCount: number;
  imageType: ImageType;
  category: string;
  editorialStatus: 'none' | 'editorial' | 'commercial';
  prefix: string;
  suffix: string;
  negativeTitleWords: string;
  negativeKeywords: string;
}

interface AdvancedMetadataControlsProps {
  settings: MetadataSettings;
  onSettingsChange: (settings: MetadataSettings) => void;
}

const platformOptions = [
  { value: 'adobe_stock', label: '🎨 Adobe Stock' },
  { value: 'shutterstock', label: '📷 Shutterstock' },
  { value: 'istock', label: '📸 iStock' },
  { value: 'getty', label: '🖼️ Getty Images' },
  { value: 'alamy', label: '🏞️ Alamy' },
  { value: 'dreamstime', label: '💭 Dreamstime' },
  { value: '123rf', label: '🔢 123RF' },
  { value: 'depositphotos', label: '📥 Depositphotos' },
  { value: 'canva', label: '🎯 Canva Creators' },
  { value: 'freepik', label: '✨ Freepik' },
  { value: 'vecteezy', label: '🎭 Vecteezy' },
  { value: 'picfair', label: '🖌️ Picfair' },
  { value: 'eyeem', label: '👁️ EyeEm' },
  { value: 'rawpixel', label: '📦 Rawpixel' },
  { value: 'stocksy', label: '💎 Stocksy' },
  { value: 'twenty20', label: '🔷 Twenty20' },
  { value: 'wirestock', label: '🌐 Wirestock' },
   { value: 'pond5', label: '🎬 Pond5' },
   { value: 'storyblocks', label: '📹 Storyblocks' },
  { value: 'custom', label: '⚙️ Custom' },
];

// Platform-specific limits
const platformLimits: Record<ExportPlatform, { title: number; description: number; keywords: number }> = {
   adobe_stock: { title: 70, description: 0, keywords: 50 },
  shutterstock: { title: 200, description: 200, keywords: 50 },
  istock: { title: 100, description: 200, keywords: 50 },
  getty: { title: 250, description: 2000, keywords: 50 },
  alamy: { title: 255, description: 255, keywords: 50 },
  dreamstime: { title: 100, description: 200, keywords: 50 },
  '123rf': { title: 100, description: 200, keywords: 50 },
  depositphotos: { title: 200, description: 200, keywords: 50 },
  canva: { title: 100, description: 200, keywords: 25 },
  freepik: { title: 100, description: 200, keywords: 50 },
  vecteezy: { title: 100, description: 500, keywords: 40 },
  picfair: { title: 140, description: 500, keywords: 30 },
  eyeem: { title: 140, description: 300, keywords: 30 },
  rawpixel: { title: 100, description: 300, keywords: 50 },
  stocksy: { title: 100, description: 200, keywords: 50 },
  twenty20: { title: 100, description: 200, keywords: 25 },
  wirestock: { title: 200, description: 500, keywords: 50 },
   pond5: { title: 100, description: 500, keywords: 50 },
   storyblocks: { title: 100, description: 300, keywords: 50 },
  custom: { title: 200, description: 500, keywords: 50 },
};

const imageTypeOptions = [
  { value: 'none', label: 'None' },
  { value: 'photo', label: 'Photo' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'vector', label: 'Vector' },
  { value: '3d_render', label: '3D Render' },
  { value: 'ai_generated', label: 'AI Generated' },
];

// Platform-specific category options
const platformCategories: Record<ExportPlatform, { value: string; label: string }[]> = {
  adobe_stock: [
    { value: '', label: 'None' },
    { value: '1', label: '1 - Animals' },
    { value: '2', label: '2 - Buildings and Architecture' },
    { value: '3', label: '3 - Business' },
    { value: '4', label: '4 - Drinks' },
    { value: '5', label: '5 - The Environment' },
    { value: '6', label: '6 - States of Mind' },
    { value: '7', label: '7 - Food' },
    { value: '8', label: '8 - Graphic Resources' },
    { value: '9', label: '9 - Hobbies and Leisure' },
    { value: '10', label: '10 - Industry' },
    { value: '11', label: '11 - Landscapes' },
    { value: '12', label: '12 - Lifestyle' },
    { value: '13', label: '13 - People' },
    { value: '14', label: '14 - Plants and Flowers' },
    { value: '15', label: '15 - Culture and Religion' },
    { value: '16', label: '16 - Science' },
    { value: '17', label: '17 - Social Issues' },
    { value: '18', label: '18 - Sports' },
    { value: '19', label: '19 - Technology' },
    { value: '20', label: '20 - Transport' },
    { value: '21', label: '21 - Travel' },
  ],
  shutterstock: [
    { value: '', label: 'None' },
    { value: 'Abstract', label: 'Abstract' },
    { value: 'Animals/Wildlife', label: 'Animals/Wildlife' },
    { value: 'Arts', label: 'Arts' },
    { value: 'Backgrounds/Textures', label: 'Backgrounds/Textures' },
    { value: 'Beauty/Fashion', label: 'Beauty/Fashion' },
    { value: 'Buildings/Landmarks', label: 'Buildings/Landmarks' },
    { value: 'Business/Finance', label: 'Business/Finance' },
    { value: 'Celebrities', label: 'Celebrities' },
    { value: 'Editorial', label: 'Editorial' },
    { value: 'Education', label: 'Education' },
    { value: 'Food and Drink', label: 'Food and Drink' },
    { value: 'Healthcare/Medical', label: 'Healthcare/Medical' },
    { value: 'Holidays', label: 'Holidays' },
    { value: 'Industrial', label: 'Industrial' },
    { value: 'Interiors', label: 'Interiors' },
    { value: 'Miscellaneous', label: 'Miscellaneous' },
    { value: 'Nature', label: 'Nature' },
    { value: 'Objects', label: 'Objects' },
    { value: 'Parks/Outdoor', label: 'Parks/Outdoor' },
    { value: 'People', label: 'People' },
    { value: 'Religion', label: 'Religion' },
    { value: 'Science', label: 'Science' },
    { value: 'Signs/Symbols', label: 'Signs/Symbols' },
    { value: 'Sports/Recreation', label: 'Sports/Recreation' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Vintage', label: 'Vintage' },
  ],
  istock: [
    { value: '', label: 'None' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'animals', label: 'Animals' },
    { value: 'arts', label: 'Arts & Entertainment' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'food', label: 'Food & Drink' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'holidays', label: 'Holidays' },
    { value: 'nature', label: 'Nature' },
    { value: 'objects', label: 'Objects' },
    { value: 'people', label: 'People' },
    { value: 'science', label: 'Science' },
    { value: 'sports', label: 'Sports' },
    { value: 'technology', label: 'Technology' },
    { value: 'travel', label: 'Travel' },
  ],
  getty: [
    { value: '', label: 'None' },
    { value: 'creative', label: 'Creative' },
    { value: 'editorial', label: 'Editorial' },
  ],
  alamy: [
    { value: '', label: 'None' },
    { value: 'news', label: 'News & Current Affairs' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'sport', label: 'Sport' },
    { value: 'stock', label: 'Stock' },
  ],
  dreamstime: [
    { value: '', label: 'None' },
    { value: '1', label: 'Abstract' },
    { value: '2', label: 'Animals' },
    { value: '3', label: 'Architecture' },
    { value: '4', label: 'Business' },
    { value: '5', label: 'Editorial' },
    { value: '6', label: 'Food & Drink' },
    { value: '7', label: 'Healthcare' },
    { value: '8', label: 'Holidays' },
    { value: '9', label: 'Industrial' },
    { value: '10', label: 'Landscapes' },
    { value: '11', label: 'Lifestyle' },
    { value: '12', label: 'Nature' },
    { value: '13', label: 'Objects' },
    { value: '14', label: 'People' },
    { value: '15', label: 'Science' },
    { value: '16', label: 'Sports' },
    { value: '17', label: 'Technology' },
    { value: '18', label: 'Transportation' },
    { value: '19', label: 'Travel' },
  ],
  '123rf': [
    { value: '', label: 'None' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'animals', label: 'Animals' },
    { value: 'business', label: 'Business' },
    { value: 'food', label: 'Food & Drink' },
    { value: 'nature', label: 'Nature' },
    { value: 'people', label: 'People' },
    { value: 'sports', label: 'Sports' },
    { value: 'technology', label: 'Technology' },
    { value: 'travel', label: 'Travel' },
  ],
  depositphotos: [
    { value: '', label: 'None' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'animals', label: 'Animals' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'business', label: 'Business' },
    { value: 'food', label: 'Food & Drink' },
    { value: 'nature', label: 'Nature' },
    { value: 'people', label: 'People' },
    { value: 'sports', label: 'Sports' },
    { value: 'technology', label: 'Technology' },
    { value: 'travel', label: 'Travel' },
  ],
  canva: [{ value: '', label: 'None' }],
  freepik: [
    { value: '', label: 'None' },
    { value: 'photo', label: 'Photo' },
    { value: 'vector', label: 'Vector' },
    { value: 'psd', label: 'PSD' },
    { value: 'icon', label: 'Icon' },
  ],
  vecteezy: [
    { value: '', label: 'None' },
    { value: 'vector', label: 'Vector' },
    { value: 'photo', label: 'Photo' },
    { value: 'video', label: 'Video' },
  ],
  picfair: [{ value: '', label: 'None' }],
  eyeem: [{ value: '', label: 'None' }],
  rawpixel: [{ value: '', label: 'None' }],
  stocksy: [
    { value: '', label: 'None' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'business', label: 'Business' },
    { value: 'nature', label: 'Nature' },
    { value: 'travel', label: 'Travel' },
  ],
  twenty20: [{ value: '', label: 'None' }],
  wirestock: [{ value: '', label: 'None' }],
  pond5: [
    { value: '', label: 'None' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'animals', label: 'Animals' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'food', label: 'Food & Drink' },
    { value: 'nature', label: 'Nature' },
    { value: 'people', label: 'People' },
    { value: 'sports', label: 'Sports' },
    { value: 'technology', label: 'Technology' },
    { value: 'travel', label: 'Travel' },
  ],
  storyblocks: [
    { value: '', label: 'None' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'animals', label: 'Animals' },
    { value: 'business', label: 'Business' },
    { value: 'nature', label: 'Nature' },
    { value: 'people', label: 'People' },
    { value: 'technology', label: 'Technology' },
  ],
  custom: [{ value: '', label: 'None' }],
};

const editorialOptions = [
  { value: 'none', label: 'Not Specified' },
  { value: 'editorial', label: 'Editorial Use Only' },
  { value: 'commercial', label: 'Commercial Use' },
];

// Platforms that support editorial flag
const platformSupportsEditorial: Record<ExportPlatform, boolean> = {
  adobe_stock: true,
  shutterstock: true,
  istock: true,
  getty: true,
  alamy: true,
  dreamstime: true,
  '123rf': true,
  depositphotos: true,
  canva: false,
  freepik: false,
  vecteezy: false,
  picfair: true,
  eyeem: false,
  rawpixel: false,
  stocksy: true,
  twenty20: false,
  wirestock: true,
  pond5: true,
  storyblocks: true,
  custom: true,
};

export function AdvancedMetadataControls({ settings, onSettingsChange }: AdvancedMetadataControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAutoLimits, setIsAutoLimits] = useState(true);
  const prevPlatformRef = useRef(settings.exportPlatform);

  const updateSetting = <K extends keyof MetadataSettings>(key: K, value: MetadataSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Auto-apply platform limits when platform changes
  useEffect(() => {
    if (isAutoLimits && settings.exportPlatform !== prevPlatformRef.current) {
      const limits = platformLimits[settings.exportPlatform];
      onSettingsChange({
        ...settings,
        titleLength: limits.title,
        descriptionLength: limits.description,
        keywordsCount: limits.keywords,
      });
      prevPlatformRef.current = settings.exportPlatform;
    }
  }, [settings.exportPlatform, isAutoLimits]);

  // Reset to platform defaults
  const resetToDefaults = () => {
    const limits = platformLimits[settings.exportPlatform];
    onSettingsChange({
      ...settings,
      titleLength: limits.title,
      descriptionLength: limits.description,
      keywordsCount: limits.keywords,
    });
  };

  const currentLimits = platformLimits[settings.exportPlatform];

  return (
    <motion.div 
      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Header - Collapsible Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Settings2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Advance Metadata Controls</h3>
            <p className="text-xs text-muted-foreground">Customize output settings for different platforms</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 pt-0 space-y-6 border-t border-border/50">
              {/* Export Platform */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  EXPORT PLATFORM
                </Label>
                <Select 
                  value={settings.exportPlatform} 
                  onValueChange={(value) => updateSetting('exportPlatform', value as ExportPlatform)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50 max-h-[300px]">
                    {platformOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Platform Requirements Checklist */}
                <AnimatePresence mode="wait">
                  <PlatformChecklist platform={settings.exportPlatform} />
                </AnimatePresence>
              </div>

              {/* Title Length */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Title Length</Label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      max {currentLimits.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {settings.titleLength} Characters
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">mix</span>
                      <Switch 
                        checked={settings.titleLengthMix}
                        onCheckedChange={(checked) => updateSetting('titleLengthMix', checked)}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>
                <Slider
                  value={[settings.titleLength]}
                  onValueChange={([value]) => updateSetting('titleLength', value)}
                  min={30}
                  max={Math.max(200, currentLimits.title)}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Description Character Length */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Description Length</Label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      max {currentLimits.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {settings.descriptionLength} Characters
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Fixed</span>
                      <Switch 
                        checked={settings.descriptionLengthFixed}
                        onCheckedChange={(checked) => updateSetting('descriptionLengthFixed', checked)}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>
                <Slider
                  value={[settings.descriptionLength]}
                  onValueChange={([value]) => updateSetting('descriptionLength', value)}
                  min={50}
                  max={Math.max(500, currentLimits.description)}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Keywords Count */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Keywords Count</Label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      max {currentLimits.keywords}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {settings.keywordsCount} Keywords
                  </span>
                </div>
                <Slider
                  value={[settings.keywordsCount]}
                  onValueChange={([value]) => updateSetting('keywordsCount', value)}
                  min={10}
                  max={Math.max(50, currentLimits.keywords)}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Auto Limits Toggle & Reset */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={isAutoLimits}
                    onCheckedChange={setIsAutoLimits}
                  />
                  <div>
                    <p className="text-sm font-medium">Auto Platform Limits</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically set limits when platform changes
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToDefaults}
                  className="h-8 px-2 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Image Type */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Image Type</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[250px]">
                        <p className="text-xs">Select the appropriate image type to add relevant prefixes to titles.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select 
                  value={settings.imageType} 
                  onValueChange={(value) => updateSetting('imageType', value as ImageType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select image type" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category & Editorial Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[250px]">
                          <p className="text-xs">Platform-specific category for better discoverability. Categories vary by platform.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select 
                    value={settings.category} 
                    onValueChange={(value) => updateSetting('category', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      {platformCategories[settings.exportPlatform]?.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Editorial Status */}
                {platformSupportsEditorial[settings.exportPlatform] && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Editorial Status</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[250px]">
                            <p className="text-xs">Editorial: newsworthy content, cannot be used for ads. Commercial: requires model/property releases.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select 
                      value={settings.editorialStatus} 
                      onValueChange={(value) => updateSetting('editorialStatus', value as 'none' | 'editorial' | 'commercial')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {editorialOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Prefix & Suffix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prefix</Label>
                  <Input
                    value={settings.prefix}
                    onChange={(e) => updateSetting('prefix', e.target.value)}
                    placeholder="e.g., Premium, HD"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Suffix</Label>
                  <Input
                    value={settings.suffix}
                    onChange={(e) => updateSetting('suffix', e.target.value)}
                    placeholder="e.g., Stock Photo, Vector"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Negative Words for Title */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Negative Words for Title</Label>
                <Input
                  value={settings.negativeTitleWords}
                  onChange={(e) => updateSetting('negativeTitleWords', e.target.value)}
                  placeholder="e.g., cheap, bad, ugly (comma separated)"
                  className="w-full"
                />
              </div>

              {/* Negative Keywords */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Negative Keywords</Label>
                <Input
                  value={settings.negativeKeywords}
                  onChange={(e) => updateSetting('negativeKeywords', e.target.value)}
                  placeholder="e.g., watermark, logo (comma separated)"
                  className="w-full"
                />
              </div>

              {/* Note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Note: You don't have to add "isolated on transparent background" for PNG images; the AI handles this.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const defaultMetadataSettings: MetadataSettings = {
  exportPlatform: 'adobe_stock',
   titleLength: 70,
  titleLengthMix: true,
   descriptionLength: 0,
  descriptionLengthFixed: false,
   keywordsCount: 50,
  imageType: 'none',
  category: '',
  editorialStatus: 'none',
  prefix: '',
  suffix: '',
  negativeTitleWords: '',
  negativeKeywords: '',
};

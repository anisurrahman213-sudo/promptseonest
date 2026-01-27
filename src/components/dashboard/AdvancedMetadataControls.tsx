import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings2, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  { value: 'custom', label: '⚙️ Custom' },
];

const imageTypeOptions = [
  { value: 'none', label: 'None' },
  { value: 'photo', label: 'Photo' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'vector', label: 'Vector' },
  { value: '3d_render', label: '3D Render' },
  { value: 'ai_generated', label: 'AI Generated' },
];

export function AdvancedMetadataControls({ settings, onSettingsChange }: AdvancedMetadataControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = <K extends keyof MetadataSettings>(key: K, value: MetadataSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

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
                  <Label className="text-sm font-medium">Title Length</Label>
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
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Description Character Length */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Description Character Length</Label>
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
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Keywords Count */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Keywords Count</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.keywordsCount} Keywords
                  </span>
                </div>
                <Slider
                  value={[settings.keywordsCount]}
                  onValueChange={([value]) => updateSetting('keywordsCount', value)}
                  min={10}
                  max={50}
                  step={1}
                  className="w-full"
                />
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
  descriptionLength: 200,
  descriptionLengthFixed: false,
  keywordsCount: 49,
  imageType: 'none',
  prefix: '',
  suffix: '',
  negativeTitleWords: '',
  negativeKeywords: '',
};

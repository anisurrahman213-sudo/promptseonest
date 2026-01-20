import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSiteSetting, useUploadHeroImage, useDeleteHeroImage, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { Loader2, Upload, Trash2, ImageIcon, Move, Type, Palette } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function HeroBackgroundManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: heroSetting, isLoading } = useSiteSetting('hero_background_url');
  const { data: sizeSetting } = useSiteSetting('hero_background_size');
  const { data: positionXSetting } = useSiteSetting('hero_background_position_x');
  const { data: positionYSetting } = useSiteSetting('hero_background_position_y');
  const { data: opacitySetting } = useSiteSetting('hero_overlay_opacity');
  const { data: textColorSetting } = useSiteSetting('hero_text_color');
  const { data: textShadowSetting } = useSiteSetting('hero_text_shadow');
  
  const uploadMutation = useUploadHeroImage();
  const deleteMutation = useDeleteHeroImage();
  const updateSetting = useUpdateSiteSetting();
  
  const [size, setSize] = useState<number>(100);
  const [positionX, setPositionX] = useState<number>(50);
  const [positionY, setPositionY] = useState<number>(50);
  const [opacity, setOpacity] = useState<number>(70);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textShadow, setTextShadow] = useState<number>(0);

  // Initialize state from settings when loaded
  const currentUrl = heroSetting?.setting_value;
  const currentSize = sizeSetting?.setting_value ? parseInt(sizeSetting.setting_value) : 100;
  const currentPositionX = positionXSetting?.setting_value ? parseInt(positionXSetting.setting_value) : 50;
  const currentPositionY = positionYSetting?.setting_value ? parseInt(positionYSetting.setting_value) : 50;
  const currentOpacity = opacitySetting?.setting_value ? parseInt(opacitySetting.setting_value) : 70;
  const currentTextColor = textColorSetting?.setting_value || '';
  const currentTextShadow = textShadowSetting?.setting_value ? parseInt(textShadowSetting.setting_value) : 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return;
    }

    uploadMutation.mutate(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    if (currentUrl) {
      deleteMutation.mutate(currentUrl);
    }
  };

  const handleSizeChange = (value: number[]) => {
    setSize(value[0]);
  };

  const handleSizeSave = () => {
    updateSetting.mutate({ key: 'hero_background_size', value: size.toString() });
  };

  const handlePositionXChange = (value: number[]) => {
    setPositionX(value[0]);
  };

  const handlePositionXSave = () => {
    updateSetting.mutate({ key: 'hero_background_position_x', value: positionX.toString() });
  };

  const handlePositionYChange = (value: number[]) => {
    setPositionY(value[0]);
  };

  const handlePositionYSave = () => {
    updateSetting.mutate({ key: 'hero_background_position_y', value: positionY.toString() });
  };

  const handleOpacityChange = (value: number[]) => {
    setOpacity(value[0]);
  };

  const handleOpacitySave = () => {
    updateSetting.mutate({ key: 'hero_overlay_opacity', value: opacity.toString() });
  };

  const handleTextColorSave = () => {
    updateSetting.mutate({ key: 'hero_text_color', value: textColor || null });
  };

  const handleTextColorReset = () => {
    setTextColor('');
    updateSetting.mutate({ key: 'hero_text_color', value: null });
  };

  const handleTextShadowChange = (value: number[]) => {
    setTextShadow(value[0]);
  };

  const handleTextShadowSave = () => {
    updateSetting.mutate({ key: 'hero_text_shadow', value: textShadow.toString() });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Hero Background
        </CardTitle>
        <CardDescription>
          Upload and customize the hero section background image
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Image Preview */}
        {currentUrl ? (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src={currentUrl}
                alt="Hero background"
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${currentPositionX}% ${currentPositionY}%`,
                  transform: `scale(${currentSize / 100})`,
                }}
              />
            </div>
            
            {/* Size Control */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Move className="h-4 w-4" />
                Image Size: {size}%
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[size]}
                  onValueChange={handleSizeChange}
                  min={50}
                  max={200}
                  step={5}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handleSizeSave}
                  disabled={updateSetting.isPending}
                >
                  Save
                </Button>
              </div>
            </div>

            {/* Position X Control */}
            <div className="space-y-2">
              <Label>Horizontal Position: {positionX}%</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[positionX]}
                  onValueChange={handlePositionXChange}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handlePositionXSave}
                  disabled={updateSetting.isPending}
                >
                  Save
                </Button>
              </div>
            </div>

            {/* Position Y Control */}
            <div className="space-y-2">
              <Label>Vertical Position: {positionY}%</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[positionY]}
                  onValueChange={handlePositionYChange}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handlePositionYSave}
                  disabled={updateSetting.isPending}
                >
                  Save
                </Button>
              </div>
            </div>

            {/* Overlay Opacity Control */}
            <div className="space-y-2">
              <Label>Overlay Opacity: {opacity}%</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[opacity]}
                  onValueChange={handleOpacityChange}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handleOpacitySave}
                  disabled={updateSetting.isPending}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                0% = No overlay (full image), 100% = Full overlay (image hidden)
              </p>
            </div>

            {/* Text Color Control */}
            <div className="space-y-2 border-t border-border pt-4">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Hero Text Color
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="color"
                    value={textColor || '#ffffff'}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    placeholder="Default (theme color)"
                    className="flex-1"
                  />
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleTextColorReset}
                >
                  Reset
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleTextColorSave}
                  disabled={updateSetting.isPending}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to use default theme color
              </p>
            </div>

            {/* Text Shadow Control */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text Shadow: {textShadow}px
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[textShadow]}
                  onValueChange={handleTextShadowChange}
                  min={0}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handleTextShadowSave}
                  disabled={updateSetting.isPending}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                0 = No shadow, higher values = stronger shadow
              </p>
              {/* Preview */}
              <div 
                className="p-4 rounded-lg border border-border bg-muted/50 text-center"
                style={{
                  color: textColor || 'inherit',
                  textShadow: textShadow > 0 ? `0 2px ${textShadow}px rgba(0,0,0,0.5)` : 'none'
                }}
              >
                <span className="text-xl font-bold">Preview Text</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Replace Image
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Hero Background?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the hero background image. The default gradient will be shown instead.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No hero background image set</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Image
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: 1920×1080 (16:9), Max 10MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}

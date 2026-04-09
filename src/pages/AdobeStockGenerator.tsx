import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, Copy, CheckCircle, Loader2, Sparkles, AlertTriangle,
  ImageIcon, FileText, Tag, MessageSquare, ClipboardCopy, Info, XCircle, Check,
  ChevronLeft, ChevronRight, Download, Trash2, RotateCcw, Images
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { platformRequirements } from '@/components/dashboard/PlatformChecklist';
import type { ExportPlatform } from '@/components/dashboard/AdvancedMetadataControls';

const ADOBE_CATEGORIES: Record<number, string> = {
  1: 'Animals', 2: 'Buildings/Architecture', 3: 'Business', 4: 'Drinks',
  5: 'Environment', 6: 'States of Mind', 7: 'Food', 8: 'Graphic Resources',
  9: 'Hobbies/Leisure', 10: 'Industry', 11: 'Landscapes', 12: 'Lifestyle',
  13: 'People', 14: 'Plants/Flowers', 15: 'Culture/Religion', 16: 'Science',
  17: 'Social Issues', 18: 'Sports', 19: 'Technology', 20: 'Transport', 21: 'Travel',
};

interface Metadata {
  title: string;
  description: string;
  keywords: string;
  prompt: string;
  category: number;
}

type ImageStatus = 'pending' | 'processing' | 'done' | 'error';

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  hasTransparency: boolean;
  resolution: { width: number; height: number; megapixels: number };
  status: ImageStatus;
  metadata: Metadata | null;
  error?: string;
}

function detectTransparency(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    if (!file.type.includes('png')) { resolve(false); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.width, 100);
      canvas.height = Math.min(img.height, 100);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(false); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) { resolve(true); URL.revokeObjectURL(url); return; }
      }
      resolve(false);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { resolve(false); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

function getImageResolution(file: File): Promise<{ width: number; height: number; megapixels: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.width, height: img.height, megapixels: (img.width * img.height) / 1_000_000 });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { resolve({ width: 0, height: 0, megapixels: 0 }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

const MAX_CONCURRENT = 5;

export default function AdobeStockGenerator() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<ExportPlatform>('adobe_stock');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const platformReq = platformRequirements[selectedPlatform];
  const titleLimit = platformReq.titleLimit;
  const descriptionLimit = platformReq.descriptionLimit;
  const keywordsLimit = platformReq.keywordsLimit;

  const updateImage = (id: string, updates: Partial<ImageItem>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newItems: ImageItem[] = [];
    for (const f of acceptedFiles) {
      const [transparent, res] = await Promise.all([detectTransparency(f), getImageResolution(f)]);
      newItems.push({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        hasTransparency: transparent,
        resolution: res,
        status: 'pending',
        metadata: null,
      });
    }
    setImages(prev => {
      const combined = [...prev, ...newItems];
      if (prev.length === 0) setSelectedIndex(0);
      return combined;
    });
    toast.success(`${acceptedFiles.length} image${acceptedFiles.length > 1 ? 's' : ''} added`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.webp'] },
    maxFiles: 100,
    maxSize: 50 * 1024 * 1024,
  });

  const generateSingle = async (item: ImageItem): Promise<Metadata | null> => {
    try {
      const base64 = await fileToBase64(item.file);
      const { data, error } = await supabase.functions.invoke('generate-adobe-metadata', {
        body: { imageBase64: base64, mimeType: item.file.type, hasTransparency: item.hasTransparency, isAiGenerated },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as Metadata;
    } catch (err: any) {
      throw err;
    }
  };

  const generateForSelected = async () => {
    const item = images[selectedIndex];
    if (!item) return;
    updateImage(item.id, { status: 'processing' });
    try {
      const metadata = await generateSingle(item);
      updateImage(item.id, { status: 'done', metadata });
      toast.success('Metadata generated!');
    } catch (err: any) {
      updateImage(item.id, { status: 'error', error: err.message });
      toast.error(err.message || 'Generation failed');
    }
  };

  const generateAll = async () => {
    const pending = images.filter(img => img.status !== 'done');
    if (pending.length === 0) { toast.info('All images already processed'); return; }
    setIsBulkProcessing(true);

    // Process in batches of MAX_CONCURRENT
    for (let i = 0; i < pending.length; i += MAX_CONCURRENT) {
      const batch = pending.slice(i, i + MAX_CONCURRENT);
      await Promise.allSettled(
        batch.map(async (item) => {
          updateImage(item.id, { status: 'processing' });
          try {
            const metadata = await generateSingle(item);
            updateImage(item.id, { status: 'done', metadata });
          } catch (err: any) {
            updateImage(item.id, { status: 'error', error: err.message });
          }
        })
      );
    }

    setIsBulkProcessing(false);
    const doneCount = images.filter(i => i.status === 'done').length + pending.filter(() => true).length;
    toast.success(`Bulk processing complete!`);
  };

  const retryFailed = async () => {
    const failed = images.filter(img => img.status === 'error');
    if (failed.length === 0) return;
    setIsBulkProcessing(true);
    for (let i = 0; i < failed.length; i += MAX_CONCURRENT) {
      const batch = failed.slice(i, i + MAX_CONCURRENT);
      await Promise.allSettled(
        batch.map(async (item) => {
          updateImage(item.id, { status: 'processing', error: undefined });
          try {
            const metadata = await generateSingle(item);
            updateImage(item.id, { status: 'done', metadata });
          } catch (err: any) {
            updateImage(item.id, { status: 'error', error: err.message });
          }
        })
      );
    }
    setIsBulkProcessing(false);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (selectedIndex >= filtered.length) setSelectedIndex(Math.max(0, filtered.length - 1));
      return filtered;
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setSelectedIndex(0);
  };

  const exportCSV = () => {
    const completed = images.filter(img => img.metadata);
    if (completed.length === 0) { toast.error('No completed metadata to export'); return; }
    const headers = 'Filename,Title,Keywords,Category,Releases';
    const rows = completed.map(img => {
      const m = img.metadata!;
      const title = m.title.replace(/[,:]/g, '');
      const cat = m.category;
      return `"${img.file.name}","${title}","${m.keywords}","${cat}",""`;
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adobe-stock-metadata-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${completed.length} items to CSV`);
  };

  const selected = images[selectedIndex] ?? null;
  const doneCount = images.filter(i => i.status === 'done').length;
  const errorCount = images.filter(i => i.status === 'error').length;
  const processingCount = images.filter(i => i.status === 'processing').length;
  const progress = images.length > 0 ? (doneCount / images.length) * 100 : 0;

  const keywordCount = selected?.metadata?.keywords
    ? selected.metadata.keywords.split(',').map(k => k.trim()).filter(Boolean).length
    : 0;

  const copyAll = async () => {
    if (!selected?.metadata) return;
    const m = selected.metadata;
    const text = `Title: ${m.title}\n\nDescription: ${m.description}\n\nKeywords: ${m.keywords}\n\nPrompt: ${m.prompt}\n\nCategory: ${ADOBE_CATEGORIES[m.category] || m.category}`;
    await navigator.clipboard.writeText(text);
    toast.success('All metadata copied!');
  };

  const guidelineChecks = selected?.metadata ? [
    { label: 'Title ≤ 70 characters', pass: selected.metadata.title.length <= 70, value: `${selected.metadata.title.length}/70` },
    { label: 'No commas/colons in title', pass: !/[,:]/.test(selected.metadata.title) },
    { label: 'Description 200-500 chars', pass: selected.metadata.description.length >= 200 && selected.metadata.description.length <= 500, value: `${selected.metadata.description.length} chars` },
    { label: '49 keywords', pass: keywordCount === 49, value: `${keywordCount}/49` },
    { label: 'Single words only', pass: !selected.metadata.keywords.split(',').some(k => k.trim().includes(' ')) },
    { label: 'Minimum 4MP', pass: selected.resolution.megapixels >= 4, value: `${selected.resolution.megapixels.toFixed(1)}MP` },
    { label: 'Valid category', pass: selected.metadata.category >= 1 && selected.metadata.category <= 21, value: ADOBE_CATEGORIES[selected.metadata.category] },
    ...(selected.hasTransparency ? [{ label: 'Transparent BG in title', pass: /transparent/i.test(selected.metadata.title) }] : []),
    ...(isAiGenerated ? [{ label: 'AI Generated flagged', pass: true }] : []),
  ] : [];

  return (
    <>
      <SEOHead title="Adobe Stock Metadata Generator" description="Generate optimized metadata for Adobe Stock images with AI — bulk upload supported" path="/adobe-stock-generator" />
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-6 sm:py-10">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" /> AI-Powered Metadata Generator
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Adobe Stock Metadata Generator</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Upload images and get perfectly optimized metadata — supports bulk processing up to 100 images at once.</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Upload + Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upload Area */}
              <Card>
                <CardContent className="p-6">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                      isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-3 py-4">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {images.length > 0 ? 'Add more images' : 'Drop your images here'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse — JPG, PNG, TIFF, WebP — up to 100 images
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Controls + Thumbnail Strip */}
              {images.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Stats Bar */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="gap-1.5">
                            <Images className="h-3.5 w-3.5" /> {images.length} images
                          </Badge>
                          {doneCount > 0 && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
                              <CheckCircle className="h-3 w-3" /> {doneCount} done
                            </Badge>
                          )}
                          {errorCount > 0 && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" /> {errorCount} failed
                            </Badge>
                          )}
                          {processingCount > 0 && (
                            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> {processingCount} processing
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Switch id="ai-toggle" checked={isAiGenerated} onCheckedChange={setIsAiGenerated} />
                            <Label htmlFor="ai-toggle" className="text-xs">AI Generated</Label>
                          </div>
                          {isAiGenerated && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        </div>
                      </div>

                      {(isBulkProcessing || doneCount > 0) && (
                        <Progress value={progress} className="h-2" />
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={generateAll}
                          disabled={isBulkProcessing}
                          className="bg-gradient-primary hover:opacity-90 gap-2"
                        >
                          {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          {isBulkProcessing ? `Processing...` : 'Generate All'}
                        </Button>
                        {errorCount > 0 && (
                          <Button variant="outline" onClick={retryFailed} disabled={isBulkProcessing} className="gap-2">
                            <RotateCcw className="h-4 w-4" /> Retry Failed ({errorCount})
                          </Button>
                        )}
                        {doneCount > 0 && (
                          <Button variant="outline" onClick={exportCSV} className="gap-2">
                            <Download className="h-4 w-4" /> Export CSV ({doneCount})
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive gap-1 ml-auto">
                          <Trash2 className="h-3.5 w-3.5" /> Clear All
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Thumbnail Strip */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedIndex(i)}
                        className={cn(
                          "relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all",
                          i === selectedIndex ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
                        )}
                      >
                        <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />
                        {/* Status overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {img.status === 'processing' && (
                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                          )}
                          {img.status === 'done' && (
                            <div className="absolute bottom-0.5 right-0.5">
                              <CheckCircle className="h-4 w-4 text-emerald-500 drop-shadow-md" />
                            </div>
                          )}
                          {img.status === 'error' && (
                            <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                              <XCircle className="h-4 w-4 text-destructive" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Selected Image Detail */}
                  {selected && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Preview */}
                          <div className="shrink-0 sm:w-48">
                            <div className="rounded-lg overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlN2ViIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=')]">
                              <img src={selected.preview} alt="Selected" className="w-full max-h-40 object-contain" />
                            </div>
                          </div>
                          {/* Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate max-w-[200px]">{selected.file.name}</p>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={selectedIndex === 0} onClick={() => setSelectedIndex(i => i - 1)}>
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground">{selectedIndex + 1}/{images.length}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={selectedIndex === images.length - 1} onClick={() => setSelectedIndex(i => i + 1)}>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant={selected.resolution.megapixels >= 4 ? 'default' : 'destructive'} className="text-xs">
                                {selected.resolution.width}×{selected.resolution.height} ({selected.resolution.megapixels.toFixed(1)}MP)
                              </Badge>
                              {selected.hasTransparency && <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">Transparent</Badge>}
                              <Badge variant="outline" className="text-xs capitalize">{selected.status}</Badge>
                            </div>
                            {selected.error && <p className="text-xs text-destructive">{selected.error}</p>}
                            <div className="flex gap-2 pt-1">
                              {selected.status !== 'done' && (
                                <Button
                                  size="sm"
                                  onClick={generateForSelected}
                                  disabled={selected.status === 'processing' || isBulkProcessing}
                                  className="gap-1.5 bg-gradient-primary hover:opacity-90"
                                >
                                  {selected.status === 'processing' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                  Generate
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => removeImage(selected.id)} className="text-destructive hover:text-destructive gap-1">
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Metadata Results for Selected */}
                  <AnimatePresence mode="wait">
                    {selected?.metadata && (
                      <motion.div key={selected.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="flex justify-end">
                          <Button onClick={copyAll} variant="outline" className="gap-2">
                            <ClipboardCopy className="h-4 w-4" /> Copy All
                          </Button>
                        </div>
                        <MetadataField icon={<FileText className="h-4 w-4" />} label="Title" sublabel={`${selected.metadata.title.length}/70`}
                          value={selected.metadata.title}
                          onChange={(v) => updateImage(selected.id, { metadata: { ...selected.metadata!, title: v } })}
                          singleLine />
                        <MetadataField icon={<MessageSquare className="h-4 w-4" />} label="Description" sublabel={`${selected.metadata.description.length} chars`}
                          value={selected.metadata.description}
                          onChange={(v) => updateImage(selected.id, { metadata: { ...selected.metadata!, description: v } })} />
                        <MetadataField icon={<Tag className="h-4 w-4" />} label="Keywords"
                          sublabel={<span className={cn(keywordCount === 49 ? 'text-emerald-600' : 'text-amber-600')}>{keywordCount}/49</span>}
                          value={selected.metadata.keywords}
                          onChange={(v) => updateImage(selected.id, { metadata: { ...selected.metadata!, keywords: v } })} />
                        <MetadataField icon={<ImageIcon className="h-4 w-4" />} label="AI Prompt"
                          value={selected.metadata.prompt}
                          onChange={(v) => updateImage(selected.id, { metadata: { ...selected.metadata!, prompt: v } })} />
                        <Card>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Category</span>
                            </div>
                            <Badge variant="secondary" className="text-sm">
                              {selected.metadata.category} — {ADOBE_CATEGORIES[selected.metadata.category] || 'Unknown'}
                            </Badge>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* Right: Guidelines */}
            <div className="space-y-6">
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Adobe Stock Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selected?.metadata ? (
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <GuidelineItem text="Title: Max 70 chars, no commas/colons" />
                      <GuidelineItem text="Description: 200-500 characters" />
                      <GuidelineItem text="Keywords: Exactly 49 single words" />
                      <GuidelineItem text="No keyword stuffing" />
                      <GuidelineItem text="Minimum 4MP resolution" />
                      <GuidelineItem text="PNG transparent = auto-label" />
                      <GuidelineItem text="AI content must be disclosed" />
                      <GuidelineItem text="No trademarked terms" />
                      <GuidelineItem text="Category must be 1-21" />
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {guidelineChecks.map((check, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            {check.pass ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                            <span className={cn(!check.pass && 'text-destructive')}>{check.label}</span>
                          </div>
                          {check.value && <span className="text-xs text-muted-foreground font-mono">{check.value}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Pro Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Use "Generate All" for bulk processing — 5 images processed in parallel.</p>
                  <p>• Click any thumbnail to view/edit its metadata.</p>
                  <p>• Export CSV for direct upload to Adobe Stock.</p>
                  <p>• Edit generated metadata to add niche-specific terms.</p>
                  <p>• Always verify AI-generated flags before submitting.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function MetadataField({ icon, label, sublabel, value, onChange, singleLine }: {
  icon: React.ReactNode; label: string; sublabel?: React.ReactNode;
  value: string; onChange: (v: string) => void; singleLine?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary">{icon}</span>
            <span className="font-semibold text-sm">{label}</span>
            {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
          </div>
          <CopyButton text={value} label={label} />
        </div>
        {singleLine ? (
          <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
        ) : (
          <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="text-sm resize-y" />
        )}
      </CardContent>
    </Card>
  );
}

function GuidelineItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
      <span>{text}</span>
    </div>
  );
}

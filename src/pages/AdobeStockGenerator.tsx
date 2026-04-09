import { useState, useCallback, useRef } from 'react';
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
import {
  Upload, Copy, CheckCircle, Loader2, Sparkles, AlertTriangle,
  ImageIcon, FileText, Tag, MessageSquare, ClipboardCopy, Info, XCircle, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

function detectTransparency(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    if (!file.type.includes('png')) {
      resolve(false);
      return;
    }
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
      const mp = (img.width * img.height) / 1_000_000;
      resolve({ width: img.width, height: img.height, megapixels: mp });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { resolve({ width: 0, height: 0, megapixels: 0 }); URL.revokeObjectURL(url); };
    img.src = url;
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
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

export default function AdobeStockGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hasTransparency, setHasTransparency] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [resolution, setResolution] = useState<{ width: number; height: number; megapixels: number } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setMetadata(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
    const [transparent, res] = await Promise.all([detectTransparency(f), getImageResolution(f)]);
    setHasTransparency(transparent);
    setResolution(res);
    if (transparent) toast.info('Transparent background detected!');
    if (res.megapixels < 4) toast.warning(`Image is ${res.megapixels.toFixed(1)}MP — Adobe Stock requires minimum 4MP`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.webp'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const generateMetadata = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('generate-adobe-metadata', {
        body: {
          imageBase64: base64,
          mimeType: file.type,
          hasTransparency,
          isAiGenerated,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMetadata(data);
      toast.success('Metadata generated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate metadata');
    } finally {
      setLoading(false);
    }
  };

  const keywordCount = metadata?.keywords ? metadata.keywords.split(',').map(k => k.trim()).filter(Boolean).length : 0;

  const copyAll = async () => {
    if (!metadata) return;
    const text = `Title: ${metadata.title}\n\nDescription: ${metadata.description}\n\nKeywords: ${metadata.keywords}\n\nPrompt: ${metadata.prompt}\n\nCategory: ${ADOBE_CATEGORIES[metadata.category] || metadata.category}`;
    await navigator.clipboard.writeText(text);
    toast.success('All metadata copied!');
  };

  const guidelineChecks = metadata ? [
    { label: 'Title ≤ 70 characters', pass: metadata.title.length <= 70, value: `${metadata.title.length}/70` },
    { label: 'No commas/colons in title', pass: !/[,:]/.test(metadata.title) },
    { label: 'Description 200-500 chars', pass: metadata.description.length >= 200 && metadata.description.length <= 500, value: `${metadata.description.length} chars` },
    { label: '49 keywords', pass: keywordCount === 49, value: `${keywordCount}/49` },
    { label: 'Single words only in keywords', pass: !metadata.keywords.split(',').some(k => k.trim().includes(' ')) },
    { label: 'Minimum 4MP resolution', pass: (resolution?.megapixels ?? 0) >= 4, value: resolution ? `${resolution.megapixels.toFixed(1)}MP` : 'N/A' },
    { label: 'Valid category', pass: metadata.category >= 1 && metadata.category <= 21, value: ADOBE_CATEGORIES[metadata.category] },
    ...(hasTransparency ? [{ label: 'Transparent BG in title', pass: /transparent/i.test(metadata.title) }] : []),
    ...(isAiGenerated ? [{ label: 'AI Generated flagged', pass: true }] : []),
  ] : [];

  return (
    <>
      <SEOHead title="Adobe Stock Metadata Generator" description="Generate optimized metadata for Adobe Stock images with AI" />
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-6 sm:py-10">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" /> AI-Powered Metadata Generator
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Adobe Stock Metadata Generator</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Upload your image and get perfectly optimized title, description, keywords, and prompt — all compliant with Adobe Stock guidelines.</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Upload + Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upload */}
              <Card>
                <CardContent className="p-6">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                      isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30",
                      preview && "p-4"
                    )}
                  >
                    <input {...getInputProps()} />
                    {preview ? (
                      <div className="space-y-4">
                        <div className="relative mx-auto max-w-md rounded-lg overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlN2ViIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=')]">
                          <img src={preview} alt="Preview" className="max-h-64 mx-auto object-contain" />
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <Badge variant="outline">{file?.name}</Badge>
                          {resolution && (
                            <Badge variant={resolution.megapixels >= 4 ? 'default' : 'destructive'}>
                              {resolution.width}×{resolution.height} ({resolution.megapixels.toFixed(1)}MP)
                            </Badge>
                          )}
                          {hasTransparency && <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Transparent BG</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">Drop another image to replace</p>
                      </div>
                    ) : (
                      <div className="space-y-3 py-6">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Upload className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Drop your image here</p>
                          <p className="text-sm text-muted-foreground">or click to browse — JPG, PNG, TIFF, WebP</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Controls */}
              {file && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Switch id="ai-toggle" checked={isAiGenerated} onCheckedChange={setIsAiGenerated} />
                            <Label htmlFor="ai-toggle" className="text-sm font-medium">AI Generated Image</Label>
                          </div>
                          {isAiGenerated && (
                            <div className="flex items-center gap-1.5 text-amber-600 text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Must be disclosed on Adobe Stock</span>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={generateMetadata}
                          disabled={loading}
                          size="lg"
                          className="bg-gradient-primary hover:opacity-90 gap-2"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          {loading ? 'Generating...' : 'Generate Metadata'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Results */}
              <AnimatePresence>
                {metadata && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    {/* Copy All */}
                    <div className="flex justify-end">
                      <Button onClick={copyAll} className="gap-2">
                        <ClipboardCopy className="h-4 w-4" /> Copy All Metadata
                      </Button>
                    </div>

                    {/* Title */}
                    <MetadataField
                      icon={<FileText className="h-4 w-4" />}
                      label="Title"
                      sublabel={`${metadata.title.length}/70 characters`}
                      value={metadata.title}
                      onChange={(v) => setMetadata({ ...metadata, title: v })}
                      singleLine
                    />

                    {/* Description */}
                    <MetadataField
                      icon={<MessageSquare className="h-4 w-4" />}
                      label="Description"
                      sublabel={`${metadata.description.length} characters`}
                      value={metadata.description}
                      onChange={(v) => setMetadata({ ...metadata, description: v })}
                    />

                    {/* Keywords */}
                    <MetadataField
                      icon={<Tag className="h-4 w-4" />}
                      label="Keywords"
                      sublabel={
                        <span className={cn(keywordCount === 49 ? 'text-emerald-600' : 'text-amber-600')}>
                          {keywordCount}/49 keywords
                        </span>
                      }
                      value={metadata.keywords}
                      onChange={(v) => setMetadata({ ...metadata, keywords: v })}
                    />

                    {/* Prompt */}
                    <MetadataField
                      icon={<ImageIcon className="h-4 w-4" />}
                      label="AI Prompt"
                      value={metadata.prompt}
                      onChange={(v) => setMetadata({ ...metadata, prompt: v })}
                    />

                    {/* Category */}
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Category</span>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                          {metadata.category} — {ADOBE_CATEGORIES[metadata.category] || 'Unknown'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  {!metadata ? (
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <GuidelineItem text="Title: Max 70 chars, no commas/colons" />
                      <GuidelineItem text="Description: 200-500 characters" />
                      <GuidelineItem text="Keywords: Exactly 49 single words" />
                      <GuidelineItem text="No keyword stuffing" />
                      <GuidelineItem text="No special characters in title" />
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
                            {check.pass ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                            <span className={cn(!check.pass && 'text-destructive')}>{check.label}</span>
                          </div>
                          {check.value && (
                            <span className="text-xs text-muted-foreground font-mono">{check.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Pro Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Place the most important keywords first — they carry more weight in search.</p>
                  <p>• Write titles as natural phrases, not keyword lists.</p>
                  <p>• Use relevant, specific terms over generic ones.</p>
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
  icon: React.ReactNode;
  label: string;
  sublabel?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  singleLine?: boolean;
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
          <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="text-sm resize-y" />
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

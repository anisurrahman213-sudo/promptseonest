import { useState, useCallback } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Download, Loader2, Sparkles, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SourcePlatform, ConversionResult, PLATFORM_CONFIG } from '@/components/platform-converter/types';
import { PlatformCard } from '@/components/platform-converter/PlatformCard';
import { BulkConverter } from '@/components/platform-converter/BulkConverter';

export default function PlatformConverter() {
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState<SourcePlatform>('adobe_stock');
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const keywordCount = keywords.trim() ? keywords.split(',').map(k => k.trim()).filter(Boolean).length : 0;

  const handleConvert = useCallback(async () => {
    if (!title.trim() || !keywords.trim() || !description.trim()) {
      toast.error('Please fill in all fields before converting');
      return;
    }
    setConverting(true);
    setResult(null);
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
      const { data, error } = await supabase.functions.invoke('platform-convert', {
        body: { title: title.trim(), keywords: keywordArray, description: description.trim(), source_platform: sourcePlatform },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as ConversionResult);
      toast.success('Metadata converted for all platforms successfully');
    } catch (err: any) {
      toast.error(err.message || 'Conversion failed. Please try again.');
    } finally {
      setConverting(false);
    }
  }, [title, keywords, description, sourcePlatform]);

  const downloadAllCsv = useCallback(() => {
    if (!result) return;
    PLATFORM_CONFIG.forEach(config => {
      const r = result[config.key];
      const escCsv = (s: string) => `"${s.replace(/"/g, '""')}"`;
      const rows = [['Filename', 'Title', 'Keywords', 'Description'], ['', r.title, r.keywords.join(', '), r.description]];
      const csv = rows.map(row => row.map(escCsv).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.key}_metadata.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
    toast.success('All 3 CSV files downloaded');
  }, [result]);

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <motion.div className="min-h-screen bg-background" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SEOHead title="Platform Converter — PromptSEONest" description="Convert stock metadata between Adobe Stock, Shutterstock, and Freepik formats instantly" path="/platform-converter" />
      <Header />
      <main className="container max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {/* Hero */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <ArrowRightLeft className="w-4 h-4" /> Platform Converter
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Convert Your Metadata to Any Platform</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Paste your stock metadata and receive platform-optimised versions for Adobe Stock, Shutterstock, and Freepik simultaneously.
          </p>
        </motion.div>

        {/* Mode Tabs */}
        <Tabs defaultValue="single" className="mb-8">
          <TabsList className="grid grid-cols-2 w-full max-w-xs mx-auto mb-6">
            <TabsTrigger value="single" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Single</TabsTrigger>
            <TabsTrigger value="bulk" className="gap-1.5"><Layers className="w-3.5 h-3.5" /> Bulk CSV</TabsTrigger>
          </TabsList>

          {/* Single Convert */}
          <TabsContent value="single">
            <Card className="mb-8 border-2">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">Source Platform</label>
                  <Tabs value={sourcePlatform} onValueChange={v => setSourcePlatform(v as SourcePlatform)}>
                    <TabsList className="grid grid-cols-3 w-full max-w-sm h-auto">
                      <TabsTrigger value="adobe_stock" className="text-xs sm:text-sm px-1 sm:px-3 py-2 truncate">Adobe Stock</TabsTrigger>
                      <TabsTrigger value="shutterstock" className="text-xs sm:text-sm px-1 sm:px-3 py-2 truncate">Shutterstock</TabsTrigger>
                      <TabsTrigger value="freepik" className="text-xs sm:text-sm px-1 sm:px-3 py-2 truncate">Freepik</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Title</label>
                    <span className="text-xs text-muted-foreground">{title.length}/70</span>
                  </div>
                  <Input placeholder="Paste your title here..." value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Keywords</label>
                    <span className="text-xs text-muted-foreground">{keywordCount} keywords</span>
                  </div>
                  <Textarea placeholder="Paste comma-separated keywords..." value={keywords} onChange={e => setKeywords(e.target.value)} rows={3} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Description</label>
                    <span className="text-xs text-muted-foreground">{description.length}/500</span>
                  </div>
                  <Textarea placeholder="Paste your description here..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                </div>
                <Button className="w-full" size="lg" onClick={handleConvert} disabled={converting || !title.trim() || !keywords.trim() || !description.trim()}>
                  {converting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Converting...</> : <><Sparkles className="w-4 h-4 mr-2" /> Convert to All Platforms</>}
                </Button>
              </CardContent>
            </Card>

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    {PLATFORM_CONFIG.map(config => (
                      <PlatformCard key={config.key} config={config} result={result[config.key]} changes={config.key === 'adobe_stock' ? undefined : result.changes_made[config.key as 'shutterstock' | 'freepik']} />
                    ))}
                  </div>
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">Export All Three Platforms</h3>
                        <p className="text-sm text-muted-foreground">Download CSV files for each platform simultaneously</p>
                      </div>
                      <Button onClick={downloadAllCsv} variant="secondary">
                        <Download className="w-4 h-4 mr-2" /> Download All 3 CSVs
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Bulk Convert */}
          <TabsContent value="bulk">
            <BulkConverter />
          </TabsContent>
        </Tabs>
      </main>
    </motion.div>
  );
}

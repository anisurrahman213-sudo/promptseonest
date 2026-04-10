import { useState, useCallback } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft, Copy, Download, Loader2, CheckCircle, AlertTriangle, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type SourcePlatform = 'adobe_stock' | 'shutterstock' | 'freepik';

interface PlatformResult {
  title: string;
  keywords: string[];
  description: string;
  score: number;
}

interface ConversionResult {
  adobe_stock: PlatformResult;
  shutterstock: PlatformResult;
  freepik: PlatformResult;
  changes_made: {
    shutterstock: string[];
    freepik: string[];
  };
}

const PLATFORM_CONFIG = [
  { key: 'adobe_stock' as const, label: 'Adobe Stock', icon: '🅰️', color: 'border-red-500/40 bg-red-500/5', badge: 'bg-red-500/15 text-red-500', maxTitle: 70, maxKw: 49, descRange: '200–500' },
  { key: 'shutterstock' as const, label: 'Shutterstock', icon: '🔴', color: 'border-orange-500/40 bg-orange-500/5', badge: 'bg-orange-500/15 text-orange-500', maxTitle: 200, maxKw: 50, descRange: '≤200' },
  { key: 'freepik' as const, label: 'Freepik', icon: '🟡', color: 'border-blue-500/40 bg-blue-500/5', badge: 'bg-blue-500/15 text-blue-500', maxTitle: 100, maxKw: 30, descRange: '100–300' },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-green-500' : score >= 70 ? 'text-yellow-500' : 'text-red-500';
  const emoji = score >= 90 ? '💚' : score >= 70 ? '💛' : '❤️';
  return <span className={`font-bold ${color}`}>{score}/100 {emoji}</span>;
}

function PlatformCard({ config, result, changes }: {
  config: typeof PLATFORM_CONFIG[0];
  result: PlatformResult;
  changes?: string[];
}) {
  const copyField = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyAll = () => {
    const all = `Title: ${result.title}\n\nKeywords: ${result.keywords.join(', ')}\n\nDescription: ${result.description}`;
    navigator.clipboard.writeText(all);
    toast.success(`All ${config.label} metadata copied`);
  };

  const downloadCsv = () => {
    const escCsv = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = [
      ['Filename', 'Title', 'Keywords', 'Description'],
      ['', result.title, result.keywords.join(', '), result.description],
    ];
    const csv = rows.map(r => r.map(escCsv).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.key}_metadata.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${config.label} CSV downloaded`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className={`${config.color} border-2 h-full`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{config.icon}</span> {config.label}
            </CardTitle>
            <ScoreBadge score={result.score} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">Title (max {config.maxTitle})</span>
              <Badge variant="outline" className={result.title.length <= config.maxTitle ? 'text-green-500' : 'text-destructive'}>
                {result.title.length}/{config.maxTitle}
              </Badge>
            </div>
            <p className="text-sm bg-muted/50 rounded-md p-2 break-words">{result.title}</p>
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">Keywords (max {config.maxKw})</span>
              <Badge variant="outline" className={result.keywords.length <= config.maxKw ? 'text-green-500' : 'text-destructive'}>
                {result.keywords.length}/{config.maxKw}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {result.keywords.map((kw, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">Description ({config.descRange})</span>
              <Badge variant="outline" className="text-muted-foreground">{result.description.length} chars</Badge>
            </div>
            <p className="text-sm bg-muted/50 rounded-md p-2 break-words line-clamp-4">{result.description}</p>
          </div>

          {/* Changes */}
          {changes && changes.length > 0 && (
            <div className="border-t pt-3">
              <span className="text-xs font-medium text-muted-foreground uppercase">Changes Applied</span>
              <ul className="mt-1 space-y-0.5">
                {changes.map((c, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => copyField(result.title, 'Title')}>
              <Copy className="w-3 h-3 mr-1" /> Title
            </Button>
            <Button size="sm" variant="outline" onClick={() => copyField(result.keywords.join(', '), 'Keywords')}>
              <Copy className="w-3 h-3 mr-1" /> Keywords
            </Button>
            <Button size="sm" variant="outline" onClick={() => copyField(result.description, 'Description')}>
              <Copy className="w-3 h-3 mr-1" /> Desc
            </Button>
            <Button size="sm" variant="outline" onClick={copyAll}>
              <Copy className="w-3 h-3 mr-1" /> All
            </Button>
          </div>
          <Button size="sm" variant="secondary" className="w-full" onClick={downloadCsv}>
            <Download className="w-3 h-3 mr-1" /> Download CSV
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
        body: {
          title: title.trim(),
          keywords: keywordArray,
          description: description.trim(),
          source_platform: sourcePlatform,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as ConversionResult);
      toast.success('Metadata converted for all platforms successfully');
    } catch (err: any) {
      console.error('Conversion error:', err);
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
      const rows = [
        ['Filename', 'Title', 'Keywords', 'Description'],
        ['', r.title, r.keywords.join(', '), r.description],
      ];
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

        {/* Input */}
        <Card className="mb-8 border-2">
          <CardContent className="pt-6 space-y-4">
            {/* Source selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">Source Platform</label>
              <Tabs value={sourcePlatform} onValueChange={v => setSourcePlatform(v as SourcePlatform)}>
                <TabsList className="grid grid-cols-3 w-full max-w-sm">
                  <TabsTrigger value="adobe_stock">Adobe Stock</TabsTrigger>
                  <TabsTrigger value="shutterstock">Shutterstock</TabsTrigger>
                  <TabsTrigger value="freepik">Freepik</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Title</label>
                <span className="text-xs text-muted-foreground">{title.length}/70</span>
              </div>
              <Input placeholder="Paste your title here..." value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
            </div>

            {/* Keywords */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Keywords</label>
                <span className="text-xs text-muted-foreground">{keywordCount} keywords</span>
              </div>
              <Textarea placeholder="Paste comma-separated keywords..." value={keywords} onChange={e => setKeywords(e.target.value)} rows={3} />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Description</label>
                <span className="text-xs text-muted-foreground">{description.length}/500</span>
              </div>
              <Textarea placeholder="Paste your description here..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
            </div>

            <Button className="w-full" size="lg" onClick={handleConvert} disabled={converting || !title.trim() || !keywords.trim() || !description.trim()}>
              {converting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Converting...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Convert to All Platforms</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {PLATFORM_CONFIG.map(config => (
                  <PlatformCard
                    key={config.key}
                    config={config}
                    result={result[config.key]}
                    changes={config.key === 'adobe_stock' ? undefined : result.changes_made[config.key as 'shutterstock' | 'freepik']}
                  />
                ))}
              </div>

              {/* Export All */}
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
      </main>
    </motion.div>
  );
}

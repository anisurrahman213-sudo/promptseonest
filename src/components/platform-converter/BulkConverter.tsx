import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Download, Loader2, CheckCircle, XCircle, FileText, Trash2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BulkRow, ConversionResult, PLATFORM_CONFIG, SourcePlatform } from './types';
import { PlatformCard } from './PlatformCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function parseCsv(text: string): { title: string; keywords: string; description: string }[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Simple CSV parser handling quoted fields
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const header = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
  const titleIdx = header.findIndex(h => h.includes('title'));
  const kwIdx = header.findIndex(h => h.includes('keyword') || h.includes('tag'));
  const descIdx = header.findIndex(h => h.includes('description') || h.includes('desc'));

  if (titleIdx === -1 || kwIdx === -1 || descIdx === -1) return [];

  return lines.slice(1).map(line => {
    const cols = parseRow(line);
    return {
      title: cols[titleIdx] || '',
      keywords: cols[kwIdx] || '',
      description: cols[descIdx] || '',
    };
  }).filter(r => r.title && r.keywords && r.description);
}

export function BulkConverter() {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [converting, setConverting] = useState(false);
  const [sourcePlatform, setSourcePlatform] = useState<SourcePlatform>('adobe_stock');
  const [previewRow, setPreviewRow] = useState<BulkRow | null>(null);
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedCount = rows.filter(r => r.status === 'done').length;
  const errorCount = rows.filter(r => r.status === 'error').length;
  const progress = rows.length > 0 ? ((completedCount + errorCount) / rows.length) * 100 : 0;

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.error('No valid rows found. CSV must have Title, Keywords, and Description columns.');
        return;
      }
      if (parsed.length > 50) {
        toast.error('Maximum 50 rows allowed per bulk conversion');
        return;
      }
      setRows(parsed.map((r, i) => ({ index: i, ...r, status: 'pending' as const })));
      toast.success(`${parsed.length} rows loaded from CSV`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleBulkConvert = useCallback(async () => {
    if (rows.length === 0) return;
    setConverting(true);
    abortRef.current = false;

    for (let i = 0; i < rows.length; i++) {
      if (abortRef.current) break;
      if (rows[i].status === 'done') continue;

      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r));

      try {
        const keywordArray = rows[i].keywords.split(',').map(k => k.trim()).filter(Boolean);
        const { data, error } = await supabase.functions.invoke('platform-convert', {
          body: {
            title: rows[i].title,
            keywords: keywordArray,
            description: rows[i].description,
            source_platform: sourcePlatform,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'done', result: data as ConversionResult } : r));
      } catch (err: any) {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: err.message || 'Failed' } : r));
      }

      // Small delay between requests to avoid rate limiting
      if (i < rows.length - 1 && !abortRef.current) {
        await new Promise(res => setTimeout(res, 1500));
      }
    }

    setConverting(false);
    toast.success('Bulk conversion completed');
  }, [rows, sourcePlatform]);

  const handleStop = () => { abortRef.current = true; };

  const handleRetryFailed = useCallback(async () => {
    const failedIndices = rows.map((r, i) => r.status === 'error' ? i : -1).filter(i => i >= 0);
    if (failedIndices.length === 0) return;
    setConverting(true);
    abortRef.current = false;

    for (const i of failedIndices) {
      if (abortRef.current) break;
      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing', error: undefined } : r));

      try {
        const keywordArray = rows[i].keywords.split(',').map(k => k.trim()).filter(Boolean);
        const { data, error } = await supabase.functions.invoke('platform-convert', {
          body: { title: rows[i].title, keywords: keywordArray, description: rows[i].description, source_platform: sourcePlatform },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'done', result: data as ConversionResult } : r));
      } catch (err: any) {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: err.message || 'Failed' } : r));
      }

      if (!abortRef.current) await new Promise(res => setTimeout(res, 1500));
    }

    setConverting(false);
    toast.success('Retry completed');
  }, [rows, sourcePlatform]);

  const handleClear = () => { setRows([]); setPreviewRow(null); };

  const downloadAllPlatformCsv = useCallback((platformKey: 'adobe_stock' | 'shutterstock' | 'freepik') => {
    const doneRows = rows.filter(r => r.status === 'done' && r.result);
    if (doneRows.length === 0) return;

    const config = PLATFORM_CONFIG.find(p => p.key === platformKey)!;
    const escCsv = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csvRows = [
      ['Filename', 'Title', 'Keywords', 'Description'].map(escCsv).join(','),
      ...doneRows.map((r, i) => {
        const pr = r.result![platformKey];
        return ['', pr.title, pr.keywords.join(', '), pr.description].map(escCsv).join(',');
      }),
    ];
    const csv = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_${platformKey}_metadata.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${config.label} bulk CSV downloaded`);
  }, [rows]);

  const downloadAllCsv = useCallback(() => {
    (['adobe_stock', 'shutterstock', 'freepik'] as const).forEach(p => downloadAllPlatformCsv(p));
    toast.success('All 3 bulk CSV files downloaded');
  }, [downloadAllPlatformCsv]);

  const downloadSampleCsv = () => {
    const sample = `Title,Keywords,Description
"Green Caterpillar Macro Photography","caterpillar, insect, macro, nature, green, larva, wildlife","A detailed macro photograph of a vibrant green caterpillar on a leaf"
"Mountain Sunset Landscape","sunset, mountain, landscape, nature, sky, orange, scenic","Beautiful mountain landscape with dramatic sunset colours"`;
    const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_metadata.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Source Platform */}
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

      {/* Upload Area */}
      {rows.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Upload CSV File</h3>
              <p className="text-sm text-muted-foreground mb-2">
                CSV must include <strong>Title</strong>, <strong>Keywords</strong>, and <strong>Description</strong> columns. Maximum 50 rows.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => fileInputRef.current?.click()}>
                <FileText className="w-4 h-4 mr-2" /> Select CSV File
              </Button>
              <Button variant="outline" onClick={downloadSampleCsv}>
                <Download className="w-4 h-4 mr-2" /> Download Sample CSV
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress */}
          {converting && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Converting {completedCount + errorCount}/{rows.length} rows...</span>
                  <Button size="sm" variant="destructive" onClick={handleStop}>Stop</Button>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="text-green-500">✓ {completedCount} done</span>
                  {errorCount > 0 && <span className="text-red-500">✕ {errorCount} errors</span>}
                  <span>{rows.filter(r => r.status === 'pending').length} pending</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Row List */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-sm">{rows.length} rows loaded</span>
                <div className="flex gap-2">
                  {!converting && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-3 h-3 mr-1" /> Re-upload
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleClear}>
                        <Trash2 className="w-3 h-3 mr-1" /> Clear
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />

              <ScrollArea className="max-h-80">
                <div className="space-y-2">
                  {rows.map((row, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-md border bg-muted/30 text-sm">
                      <span className="w-6 text-center text-muted-foreground font-mono text-xs">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{row.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.keywords.split(',').length} keywords</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {row.status === 'pending' && <Badge variant="outline" className="text-xs">Pending</Badge>}
                        {row.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        {row.status === 'done' && (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPreviewRow(row)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {row.status === 'error' && (
                          <span className="text-xs text-destructive flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> {row.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!converting && completedCount < rows.length && (
              <Button className="flex-1" size="lg" onClick={handleBulkConvert}>
                <Loader2 className={`w-4 h-4 mr-2 ${converting ? 'animate-spin' : 'hidden'}`} />
                Convert All {rows.filter(r => r.status !== 'done').length} Rows
              </Button>
            )}
            {completedCount > 0 && !converting && (
              <>
                {PLATFORM_CONFIG.map(config => (
                  <Button key={config.key} size="sm" variant="outline" onClick={() => downloadAllPlatformCsv(config.key)}>
                    <Download className="w-3 h-3 mr-1" /> {config.label}
                  </Button>
                ))}
                <Button size="sm" variant="secondary" onClick={downloadAllCsv}>
                  <Download className="w-4 h-4 mr-2" /> All 3 CSVs
                </Button>
              </>
            )}
          </div>
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewRow} onOpenChange={() => setPreviewRow(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="truncate">Results: {previewRow?.title}</DialogTitle>
          </DialogHeader>
          {previewRow?.result && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLATFORM_CONFIG.map(config => (
                <PlatformCard
                  key={config.key}
                  config={config}
                  result={previewRow.result![config.key]}
                  changes={config.key === 'adobe_stock' ? undefined : previewRow.result!.changes_made[config.key as 'shutterstock' | 'freepik']}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

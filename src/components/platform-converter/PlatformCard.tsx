import { motion } from 'framer-motion';
import { Copy, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PLATFORM_CONFIG, PlatformResult } from './types';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-green-500' : score >= 70 ? 'text-yellow-500' : 'text-red-500';
  const emoji = score >= 90 ? '💚' : score >= 70 ? '💛' : '❤️';
  return <span className={`font-bold ${color}`}>{score}/100 {emoji}</span>;
}

export function PlatformCard({ config, result, changes }: {
  config: typeof PLATFORM_CONFIG[number];
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">Title (max {config.maxTitle})</span>
              <Badge variant="outline" className={result.title.length <= config.maxTitle ? 'text-green-500' : 'text-destructive'}>
                {result.title.length}/{config.maxTitle}
              </Badge>
            </div>
            <p className="text-sm bg-muted/50 rounded-md p-2 break-words">{result.title}</p>
          </div>

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

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">Description ({config.descRange})</span>
              <Badge variant="outline" className="text-muted-foreground">{result.description.length} chars</Badge>
            </div>
            <p className="text-sm bg-muted/50 rounded-md p-2 break-words line-clamp-4">{result.description}</p>
          </div>

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

import { useCallback, useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Generation } from '@/lib/stockPlatformFormats';

interface SimpleCsvExportButtonProps {
  generations: Generation[];
  fetchAllForExport?: () => Promise<Generation[]>;
  searchQuery?: string;
  disabled?: boolean;
}

/**
 * Unified, platform-agnostic CSV export.
 * Columns: Filename, Prompt, Title, Description, Tags
 * - RFC 4180 escaping (double-quote wrap, escape inner quotes)
 * - UTF-8 with BOM for Excel compatibility
 * - CRLF line endings (spreadsheet-friendly)
 */
const HEADERS = ['Filename', 'Prompt', 'Title', 'Description', 'Tags'] as const;

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  // Normalize newlines and strip control chars except tab/newline
  const str = String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  return `"${str.replace(/"/g, '""')}"`;
}

function normalizeTags(tags: unknown): string {
  if (!tags) return '';
  const raw = Array.isArray(tags) ? tags.join(',') : String(tags);
  return raw
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .join(', ');
}

function buildCsv(rows: Generation[]): string {
  const BOM = '\uFEFF';
  const lines: string[] = [HEADERS.map(escapeCsv).join(',')];
  for (const g of rows) {
    lines.push([
      escapeCsv(g.image_name ?? ''),
      escapeCsv(g.prompt ?? ''),
      escapeCsv(g.title ?? ''),
      escapeCsv(g.description ?? ''),
      escapeCsv(normalizeTags(g.tags)),
    ].join(','));
  }
  return BOM + lines.join('\r\n') + '\r\n';
}

export function SimpleCsvExportButton({
  generations,
  fetchAllForExport,
  searchQuery,
  disabled,
}: SimpleCsvExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (generations.length === 0) {
      toast.error('No generations to export');
      return;
    }
    setIsExporting(true);
    try {
      let data: Generation[] = generations;
      // Use full dataset only when no search filter is active
      if (!searchQuery?.trim() && fetchAllForExport) {
        try {
          const all = await fetchAllForExport();
          if (all.length > 0) data = all;
        } catch (err) {
          console.warn('[SimpleCsvExport] fetchAllForExport failed, using current page:', err);
        }
      }

      const csv = buildCsv(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = url;
      a.download = `generations_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.length} row${data.length === 1 ? '' : 's'} to CSV`);
    } catch (err) {
      console.error('[SimpleCsvExport] failed:', err);
      toast.error('CSV export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [generations, fetchAllForExport, searchQuery]);

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || isExporting || generations.length === 0}
      className="gap-2"
      title="Download Prompt, Title, Description, Tags as a unified CSV"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Export CSV</span>
      <span className="sm:hidden">CSV</span>
    </Button>
  );
}

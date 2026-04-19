import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Archive, FileSpreadsheet, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExportHistory } from '@/hooks/useExportHistory';

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function useFormatRelative() {
  const { t } = useTranslation();
  return (iso: string): string => {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diff = Date.now() - then;
    const sec = Math.max(1, Math.floor(diff / 1000));
    if (sec < 60) return t('recentExports.justNow', 'Just now');
    const min = Math.floor(sec / 60);
    if (min < 60) return t('recentExports.minutesAgo', { defaultValue: '{{count}}m ago', count: min });
    const hr = Math.floor(min / 60);
    if (hr < 24) return t('recentExports.hoursAgo', { defaultValue: '{{count}}h ago', count: hr });
    const day = Math.floor(hr / 24);
    if (day < 7) return t('recentExports.daysAgo', { defaultValue: '{{count}}d ago', count: day });
    return new Date(iso).toLocaleDateString();
  };
}

export const RecentExports = memo(() => {
  const { t } = useTranslation();
  const { entries, removeEntry, clearAll, maxEntries } = useExportHistory();

  if (entries.length === 0) return null;

  return (
    <section
      aria-label={t('recentExports.title', 'Recent Exports')}
      className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 mb-4"
    >
      <header className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <History className="h-4 w-4 text-primary shrink-0" />
          <h2 className="text-sm font-semibold text-foreground truncate">
            {t('recentExports.title', 'Recent Exports')}
          </h2>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {entries.length}/{maxEntries}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
          {t('recentExports.clearAll', 'Clear all')}
        </Button>
      </header>

      <ul className="space-y-2">
        {entries.map(entry => (
          <li
            key={entry.id}
            className="group flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 hover:bg-muted/40 transition-colors"
          >
            <div
              className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              {entry.isZip ? (
                <Archive className="h-4 w-4" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground truncate">
                  {entry.platformName}
                </span>
                {entry.isZip && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Archive className="h-2.5 w-2.5" />
                    ZIP
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {t('recentExports.itemsAndFiles', '{{items}} items · {{files}} file(s) · {{size}}', {
                  items: entry.totalItems.toLocaleString(),
                  files: entry.fileCount,
                  size: formatBytes(entry.totalSizeBytes),
                })}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {formatRelative(entry.createdAt, t)}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeEntry(entry.id)}
              aria-label={t('recentExports.remove', 'Remove from history')}
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[10px] text-muted-foreground">
        {t(
          'recentExports.noteNoBlobs',
          'Only metadata is saved locally. Re-download requires regenerating the export.',
        )}
      </p>
    </section>
  );
});

RecentExports.displayName = 'RecentExports';

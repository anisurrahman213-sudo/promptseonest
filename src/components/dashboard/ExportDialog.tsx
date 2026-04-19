import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { Download, FileSpreadsheet, Check, Search, Eye, List, Loader2, Zap, AlertCircle, FileText, Image as ImageIcon, CheckCircle2, ShieldCheck, XCircle, RefreshCw, Wrench, Archive, FolderOpen, Info } from 'lucide-react';
import { List as VirtualList, type RowComponentProps } from 'react-window';
import { findForbiddenWords, removeForbiddenWords, cleanTags, type ContentIssue } from '@/lib/contentQualityFilter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  stockPlatforms, 
  generateExport, 
  validateAdobeStockExport,
  type ExportFormat, 
  type Generation,
  type StockPlatform,
  type ExportOptions
} from '@/lib/stockPlatformFormats';
import { platformCategories, type ExportPlatform } from './AdvancedMetadataControls';
import { useExportHistory } from '@/hooks/useExportHistory';

interface ExportDialogProps {
  generations: Generation[];
  disabled?: boolean;
  fetchAllForExport?: () => Promise<Generation[]>;
  searchQuery?: string;
  exportOptions?: ExportOptions;
  onUpdateMetadata?: (id: string, data: Partial<Generation>) => Promise<boolean>;
}

// Memoized platform item component for better performance
const PlatformItem = memo(({ 
  platform, 
  isSelected, 
  onSelect 
}: { 
  platform: StockPlatform; 
  isSelected: boolean; 
  onSelect: () => void;
}) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    layout
  >
    <Label
      htmlFor={platform.id}
      onClick={onSelect}
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border hover:border-primary/30 hover:bg-muted/30'
      }`}
    >
      <RadioGroupItem value={platform.id} id={platform.id} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{platform.icon}</span>
          <span className="font-medium text-foreground">{platform.name}</span>
          {isSelected && (
            <Check className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {platform.description}
        </p>
      </div>
    </Label>
  </motion.div>
));
PlatformItem.displayName = 'PlatformItem';

// Memoized preview row component - Professional table-like view
const PreviewRow = memo(({ 
  row, 
  headers, 
  index,
  selectedFormat,
  isExpanded,
  onToggle
}: { 
  row: string[]; 
  headers: string[]; 
  index: number;
  selectedFormat: ExportFormat;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const cleanValue = (val: string) => {
    if (!val) return '-';
    return val.replace(/^"|"$/g, '').replace(/""/g, '"');
  };

  // Find important fields indices
  const filenameIndex = 0;
  const titleIndex = headers.findIndex(h => h.toLowerCase() === 'title' || h.toLowerCase() === 'headline');
  const categoryIndex = headers.findIndex(h => h.toLowerCase() === 'category' || h.toLowerCase() === 'categories');
  const keywordsIndex = headers.findIndex(h => h.toLowerCase() === 'keywords' || h.toLowerCase() === 'tags');

  // Get platform-specific category label
  const getCategoryLabel = (categoryValue: string): string => {
    if (!categoryValue || categoryValue === '-') return '-';
    
    const platformMap: Record<string, ExportPlatform> = {
      'adobe_stock': 'adobe_stock',
      'shutterstock': 'shutterstock',
      'istock': 'istock',
      'getty_images': 'getty',
      'alamy': 'alamy',
      'dreamstime': 'dreamstime',
      '123rf': '123rf',
      'depositphotos': 'depositphotos',
      'canva_creators': 'canva',
      'freepik': 'freepik',
      'vecteezy': 'vecteezy',
      'picfair': 'picfair',
      'eyeem': 'eyeem',
      'rawpixel': 'rawpixel',
      'stocksy': 'stocksy',
      'twenty20': 'twenty20',
      'pond5': 'pond5',
      'wirestock': 'wirestock',
      'storyblocks': 'storyblocks',
      'generic': 'custom',
    };
    
    const platform = platformMap[selectedFormat] || 'custom';
    const categories = platformCategories[platform] || [];
    const match = categories.find(c => c.value === categoryValue);
    return match ? match.label : categoryValue;
  };

  const filename = cleanValue(row[filenameIndex]);
  const title = titleIndex > -1 ? cleanValue(row[titleIndex]) : '-';
  const category = categoryIndex > -1 ? getCategoryLabel(cleanValue(row[categoryIndex])) : '-';
  const keywords = keywordsIndex > -1 ? cleanValue(row[keywordsIndex]) : '-';
  const keywordCount = keywords !== '-' ? keywords.split(',').length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="border rounded-lg overflow-hidden bg-card hover:shadow-sm transition-shadow"
    >
      {/* Compact Header Row */}
      <div 
        onClick={onToggle}
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{filename}</p>
          <p className="text-xs text-muted-foreground truncate">{title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {category !== '-' && (
            <Badge variant="secondary" className="text-[10px]">
              {category}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {keywordCount} keywords
          </Badge>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-muted-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-2 border-t bg-muted/30">
              {headers.map((header, colIndex) => {
                const value = cleanValue(row[colIndex]);
                const isKeywords = header.toLowerCase() === 'keywords' || header.toLowerCase() === 'tags';
                
                return (
                  <div key={colIndex} className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      {header}
                    </p>
                    {isKeywords ? (
                      <div className="flex flex-wrap gap-1">
                        {value.split(',').slice(0, 15).map((keyword, ki) => (
                          <Badge key={ki} variant="outline" className="text-[10px] font-normal">
                            {keyword.trim()}
                          </Badge>
                        ))}
                        {value.split(',').length > 15 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{value.split(',').length - 15} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-foreground break-all">{value}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
PreviewRow.displayName = 'PreviewRow';

// Virtualized row for the export summary file list (used when 50+ files)
const SUMMARY_ROW_HEIGHT = 36;
type SummaryFileRowProps = {
  files: { name: string; sizeBytes: number; rows: number }[];
  rowsLabel: string;
  formatBytes: (bytes: number) => string;
};
const SummaryFileRow = ({ index, style, files, rowsLabel, formatBytes }: RowComponentProps<SummaryFileRowProps>) => {
  const f = files[index];
  return (
    <div
      style={style}
      className="flex items-center gap-2 px-3 text-xs border-b border-border last:border-b-0"
    >
      <FileSpreadsheet className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="flex-1 truncate font-mono text-foreground">{f?.name ?? ''}</span>
      <Badge variant="outline" className="text-[10px] shrink-0">
        {(f?.rows ?? 0).toLocaleString()} {rowsLabel}
      </Badge>
      <span className="text-muted-foreground shrink-0 tabular-nums w-16 text-right">
        {f ? formatBytes(f.sizeBytes) : ''}
      </span>
    </div>
  );
};
SummaryFileRow.displayName = 'SummaryFileRow';

export function ExportDialog({ generations, disabled, fetchAllForExport, searchQuery: filterSearchQuery, exportOptions, onUpdateMetadata }: ExportDialogProps) {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('adobe_stock');
  const { addEntry: addExportHistoryEntry } = useExportHistory();

  // ===== DEV-ONLY: window.__seedFakeGenerations(count) =====
  // Lets you inject N synthetic generations from the browser console to verify
  // the auto-split + summary dialog UI (ZIP badge, multiple file rows, cached re-download).
  // Usage in console:  __seedFakeGenerations(6500)
  // Then open the Export dialog and click Export — synthetic data is used instead.
  // Call __seedFakeGenerations(0) to clear.
  const seededDataRef = useRef<Generation[] | null>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as {
      __seedFakeGenerations?: (count: number) => string;
      __clearSeededGenerations?: () => string;
    };

    const make = (count: number): Generation[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `seed-${i}`,
        user_id: 'seed-user',
        image_name: `seed-image-${String(i + 1).padStart(5, '0')}.jpg`,
        image_url: `https://example.com/seed-${i}.jpg`,
        title: `Seeded sunset over the mountains number ${i + 1}`,
        description: `A stunning seeded landscape photograph showing scenic vista ${i + 1} with vibrant natural colors and atmospheric lighting`,
        tags: 'nature,sunset,mountain,landscape,sky,outdoor,beautiful,scenic,travel,golden,seed,test,bulk,export,demo',
        prompt: 'mountain sunset landscape',
        media_type: 'image',
        category: '1',
        is_editorial: false,
        created_at: new Date().toISOString(),
      }) as Generation);

    w.__seedFakeGenerations = (count: number) => {
      if (!Number.isFinite(count) || count <= 0) {
        seededDataRef.current = null;
        return '🧹 Seeded data cleared';
      }
      seededDataRef.current = make(count);
      return `🌱 Seeded ${count.toLocaleString()} fake generations. Open Export dialog → click Export.`;
    };
    w.__clearSeededGenerations = () => {
      seededDataRef.current = null;
      return '🧹 Seeded data cleared';
    };

     
    console.info('[ExportDialog] Dev helper ready: __seedFakeGenerations(count)');

    return () => {
      delete w.__seedFakeGenerations;
      delete w.__clearSeededGenerations;
    };
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [platformSearchQuery, setPlatformSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'platforms' | 'preview' | 'quality'>('platforms');
  const [isScanning, setIsScanning] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixProgress, setAutoFixProgress] = useState(0);
  const [qualityIssues, setQualityIssues] = useState<Array<{
    id: string;
    imageName: string;
    field: string;
    foundWords: string[];
    value: string;
  }> | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [bundleAsZip, setBundleAsZip] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isRedownloading, setIsRedownloading] = useState(false);
  const [exportSummary, setExportSummary] = useState<{
    platformName: string;
    totalItems: number;
    fileCount: number;
    totalSizeBytes: number;
    isZip: boolean;
    files: { name: string; sizeBytes: number; rows: number; content: string }[];
    generatedAt: string;
    zipBlob?: Blob;
    zipFilename?: string;
  } | null>(null);

  // Memoized filtered platforms
  const filteredPlatforms = useMemo(() => 
    stockPlatforms.filter(platform =>
      platform.name.toLowerCase().includes(platformSearchQuery.toLowerCase())
    ), [platformSearchQuery]
  );

  // Memoized selected platform
  const selectedPlatform = useMemo(() => 
    stockPlatforms.find(p => p.id === selectedFormat),
    [selectedFormat]
  );

  // Memoized preview data - only compute when needed
  const previewData = useMemo(() => 
    generations.length > 0 ? generateExport(selectedFormat, generations, exportOptions) : null,
    [selectedFormat, generations, exportOptions]
  );

  // Optimized export handler with progress tracking and validation
  const handleExport = useCallback(async () => {
    const seeded = seededDataRef.current;

    if (!seeded && generations.length === 0) {
      toast.error('No generations to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(10);
    setExportStatus(seeded ? `Preparing seeded export (${seeded.length.toLocaleString()} items)...` : 'Preparing export...');

    try {
      let dataToExport: Generation[] = seeded ?? generations;

      // If using seeded data, skip fetchAll and validation fetch
      if (!seeded && !filterSearchQuery?.trim() && fetchAllForExport) {
        setIsLoadingAll(true);
        setExportProgress(20);
        setExportStatus('Loading all items...');
        try {
          const allGenerations = await fetchAllForExport();
          setExportProgress(50);
          if (allGenerations.length > 0) {
            dataToExport = allGenerations;
          }
        } catch (error) {
          console.error('Failed to fetch all generations:', error);
        } finally {
          setIsLoadingAll(false);
        }
      }

      setExportProgress(60);
      setExportStatus('Generating CSV...');

      // Auto-split limit applied to ALL platforms (Adobe Stock guideline = 5000 max)
      const MAX_ROWS = 5000;
      const isAdobeStock = selectedFormat === 'adobe_stock';

      // Validate Adobe Stock export - prevent export if Title or Keywords are empty
      if (isAdobeStock) {
        const validation = validateAdobeStockExport(dataToExport);
        if (!validation.isValid) {
          const errorMessages = validation.errors.slice(0, 3).map(e => e.message).join('\n');
          const moreErrors = validation.errors.length > 3 ? `\n...and ${validation.errors.length - 3} more errors` : '';
          toast.error(`Export blocked: Missing required fields\n${errorMessages}${moreErrors}`, {
            duration: 6000,
          });
          setIsExporting(false);
          setExportProgress(0);
          return;
        }
      }

      // Split into chunks for ANY platform if over the row limit
      const chunks: Generation[][] = [];
      if (dataToExport.length > MAX_ROWS) {
        for (let i = 0; i < dataToExport.length; i += MAX_ROWS) {
          chunks.push(dataToExport.slice(i, i + MAX_ROWS));
        }
      } else {
        chunks.push(dataToExport);
      }

      const BOM = '\uFEFF';
      const dateStr = new Date().toISOString().split('T')[0];
      let downloadedCount = 0;

      // Build all CSV files first (collect into memory)
      type CsvFile = { name: string; content: string; rows: number; sizeBytes: number };
      const csvFiles: CsvFile[] = [];
      let baseFilename = '';

      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];

        if (chunks.length > 1) {
          setExportStatus(`Generating Part ${ci + 1} of ${chunks.length}...`);
        } else {
          setExportStatus('Generating CSV...');
        }

        const exportData = generateExport(selectedFormat, chunk, exportOptions);
        baseFilename = exportData.filename;

        const csv = [
          exportData.headers.join(','),
          ...exportData.rows.map(r => r.join(',')),
        ].join('\n');

        const csvContent = BOM + csv;
        const csvSize = new Blob([csvContent]).size;

        if (isAdobeStock && csvSize > 1024 * 1024) {
          toast.warning(`Part ${ci + 1} exceeds 1MB. Some items may need smaller batches.`, { duration: 5000 });
        }

        const partSuffix = chunks.length > 1 ? `-part${ci + 1}` : '';
        csvFiles.push({
          name: `${exportData.filename}-${dateStr}${partSuffix}.csv`,
          content: csvContent,
          rows: exportData.rows.length,
          sizeBytes: csvSize,
        });
        downloadedCount += chunk.length;

        setExportProgress(60 + Math.round(((ci + 1) / chunks.length) * 30));
      }

      const triggerDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      };

      // ZIP bundling: only when multiple files AND user opted in
      if (csvFiles.length > 1 && bundleAsZip) {
        setExportStatus(`Bundling ${csvFiles.length} files into ZIP...`);
        setExportProgress(92);
        const zip = new JSZip();
        csvFiles.forEach(f => zip.file(f.name, f.content));

        // Build a human-readable README.txt inside the ZIP
        const platformInfo = stockPlatforms.find(p => p.id === selectedFormat);
        const platformName = platformInfo?.name || selectedFormat;
        const generatedAt = new Date().toLocaleString();
        const fileList = csvFiles
          .map((f, i) => `  ${i + 1}. ${f.name}`)
          .join('\n');

        const platformInstructionsKey: Partial<Record<ExportFormat, string>> = {
          adobe_stock: 'export.readme.instructionsAdobe',
          shutterstock: 'export.readme.instructionsShutterstock',
          freepik: 'export.readme.instructionsFreepik',
        };

        const instructions = platformInstructionsKey[selectedFormat]
          ? t(platformInstructionsKey[selectedFormat]!)
          : t('export.readme.instructionsGeneric', { platform: platformName });

        const heading = t('export.readme.heading', { platform: platformName });
        const readme = `${heading}
${'='.repeat(Math.max(heading.length, 20))}

${t('export.readme.generated')}: ${generatedAt}
${t('export.readme.platform')}:  ${platformName}
${t('export.readme.totalItems')}: ${downloadedCount}
${t('export.readme.totalFiles')}: ${csvFiles.length}

${t('export.readme.filesInZip')}:
${fileList}

${t('export.readme.uploadInstructions')}
${'-'.repeat(t('export.readme.uploadInstructions').length)}
${instructions}

${t('export.readme.importantNotes')}
${'-'.repeat(t('export.readme.importantNotes').length)}
• ${t('export.readme.note1')}
• ${t('export.readme.note2')}
• ${t('export.readme.note3')}
• ${t('export.readme.note4')}
• ${t('export.readme.note5')}

${t('export.readme.footer')}
`;

        zip.file('README.txt', readme);

        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        triggerDownload(zipBlob, `${baseFilename}-${dateStr}.zip`);
        setExportProgress(100);

        const platformInfoForSummary = stockPlatforms.find(p => p.id === selectedFormat);
        const zipFilename = `${baseFilename}-${dateStr}.zip`;
        setExportSummary({
          platformName: platformInfoForSummary?.name || selectedFormat,
          totalItems: downloadedCount,
          fileCount: csvFiles.length,
          totalSizeBytes: zipBlob.size,
          isZip: true,
          files: csvFiles.map(f => ({ name: f.name, sizeBytes: f.sizeBytes, rows: f.rows, content: f.content })),
          generatedAt: new Date().toLocaleString(),
          zipBlob,
          zipFilename,
        });
      } else {
        for (let i = 0; i < csvFiles.length; i++) {
          const f = csvFiles[i];
          if (csvFiles.length > 1) {
            setExportStatus(`Downloading Part ${i + 1} of ${csvFiles.length}...`);
          } else {
            setExportStatus('Downloading CSV...');
          }
          triggerDownload(new Blob([f.content], { type: 'text/csv;charset=utf-8' }), f.name);
          if (csvFiles.length > 1 && i < csvFiles.length - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
          setExportProgress(90 + Math.round(((i + 1) / csvFiles.length) * 10));
        }

        const platformInfoForSummary = stockPlatforms.find(p => p.id === selectedFormat);
        const totalSize = csvFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
        setExportSummary({
          platformName: platformInfoForSummary?.name || selectedFormat,
          totalItems: downloadedCount,
          fileCount: csvFiles.length,
          totalSizeBytes: totalSize,
          isZip: false,
          files: csvFiles.map(f => ({ name: f.name, sizeBytes: f.sizeBytes, rows: f.rows, content: f.content })),
          generatedAt: new Date().toLocaleString(),
        });
      }

      const platform = stockPlatforms.find(f => f.id === selectedFormat);
      if (csvFiles.length > 1 && bundleAsZip) {
        toast.success(`✅ ${downloadedCount} items in ${csvFiles.length} CSVs bundled into ZIP for ${platform?.name}`);
      } else if (csvFiles.length > 1) {
        toast.success(`✅ ${downloadedCount} items exported in ${csvFiles.length} CSV files for ${platform?.name}`);
      } else {
        toast.success(`✅ ${downloadedCount} items exported for ${platform?.name}`);
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
      setIsLoadingAll(false);
      setExportProgress(0);
      setExportStatus('');
    }
  }, [generations, filterSearchQuery, fetchAllForExport, selectedFormat, exportOptions, bundleAsZip]);

  // Handle format selection
  const handleFormatSelect = useCallback((format: ExportFormat) => {
    setSelectedFormat(format);
  }, []);

  // Content quality scan handler
  const handleQualityScan = useCallback(async () => {
    setIsScanning(true);
    setQualityIssues(null);
    setActiveTab('quality');

    try {
      let dataToScan = generations;
      
      // If we have fetchAllForExport, fetch ALL generations for complete scan
      if (fetchAllForExport) {
        try {
          const allGenerations = await fetchAllForExport();
          if (allGenerations.length > 0) {
            dataToScan = allGenerations;
          }
        } catch (error) {
          console.error('Failed to fetch all generations for scan:', error);
        }
      }

      const issues: Array<{
        id: string;
        imageName: string;
        field: string;
        foundWords: string[];
        value: string;
      }> = [];

      for (const gen of dataToScan) {
        const fields: Array<{ name: string; value: string }> = [
          { name: 'Title', value: gen.title },
          { name: 'Description', value: gen.description },
          { name: 'Tags', value: gen.tags },
          { name: 'Prompt', value: gen.prompt },
        ];

        for (const field of fields) {
          const foundWords = findForbiddenWords(field.value);
          if (foundWords.length > 0) {
            issues.push({
              id: gen.id,
              imageName: gen.image_name,
              field: field.name,
              foundWords,
              value: field.value,
            });
          }
        }
      }

      setQualityIssues(issues);
      
      if (issues.length === 0) {
        toast.success(t('export.noIssuesFound'));
      } else {
        toast.warning(t('export.issuesFoundWarning', { count: issues.length }));
      }
    } catch (error) {
      console.error('Quality scan error:', error);
      toast.error(t('export.scanError'));
    } finally {
      setIsScanning(false);
    }
  }, [generations, fetchAllForExport]);

  // Auto-fix all quality issues
  const handleAutoFixAll = useCallback(async () => {
    if (!qualityIssues || qualityIssues.length === 0 || !onUpdateMetadata) {
      toast.error(t('export.autoFixNotAvailable'));
      return;
    }

    setIsAutoFixing(true);
    setAutoFixProgress(0);

    try {
      // Group issues by generation ID to batch updates
      const issuesByGeneration = new Map<string, typeof qualityIssues>();
      for (const issue of qualityIssues) {
        const existing = issuesByGeneration.get(issue.id) || [];
        existing.push(issue);
        issuesByGeneration.set(issue.id, existing);
      }

      const totalGenerations = issuesByGeneration.size;
      let processed = 0;
      let fixedCount = 0;
      let failedCount = 0;

      for (const [generationId, issues] of issuesByGeneration) {
        // Find the generation to get current values
        let dataToScan = generations;
        if (fetchAllForExport) {
          try {
            dataToScan = await fetchAllForExport();
          } catch (e) {
            // Use current generations if fetch fails
          }
        }
        
        const generation = dataToScan.find(g => g.id === generationId);
        if (!generation) {
          failedCount++;
          processed++;
          setAutoFixProgress(Math.round((processed / totalGenerations) * 100));
          continue;
        }

        // Build update object with cleaned values
        const updateData: Partial<Generation> = {};
        
        for (const issue of issues) {
          if (issue.field === 'Title') {
            updateData.title = removeForbiddenWords(generation.title);
          } else if (issue.field === 'Description') {
            updateData.description = removeForbiddenWords(generation.description);
          } else if (issue.field === 'Tags') {
            updateData.tags = cleanTags(generation.tags);
          } else if (issue.field === 'Prompt') {
            updateData.prompt = removeForbiddenWords(generation.prompt);
          }
        }

        // Update the generation in database
        const success = await onUpdateMetadata(generationId, updateData);
        if (success) {
          fixedCount++;
        } else {
          failedCount++;
        }

        processed++;
        setAutoFixProgress(Math.round((processed / totalGenerations) * 100));
      }

      // Clear issues after fix
      setQualityIssues([]);
      
      if (failedCount === 0) {
        toast.success(t('export.fixedSuccess', { count: fixedCount }));
      } else {
        toast.warning(t('export.fixedPartial', { fixed: fixedCount, failed: failedCount }));
      }
    } catch (error) {
      console.error('Auto-fix error:', error);
      toast.error(t('export.autoFixFailed'));
    } finally {
      setIsAutoFixing(false);
      setAutoFixProgress(0);
    }
  }, [qualityIssues, onUpdateMetadata, generations, fetchAllForExport]);

  // Reset state on dialog close
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPlatformSearchQuery('');
      setActiveTab('platforms');
      setExportProgress(0);
      setQualityIssues(null);
      setAutoFixProgress(0);
      setExpandedRows(new Set());
    }
  }, []);

  // Format bytes for display
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Re-download the same export from the cached summary (no regeneration)
  const handleReDownload = useCallback(async () => {
    if (!exportSummary) return;
    setIsRedownloading(true);
    try {
      const triggerDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      };

      if (exportSummary.isZip && exportSummary.zipBlob && exportSummary.zipFilename) {
        triggerDownload(exportSummary.zipBlob, exportSummary.zipFilename);
      } else {
        for (let i = 0; i < exportSummary.files.length; i++) {
          const f = exportSummary.files[i];
          triggerDownload(new Blob([f.content], { type: 'text/csv;charset=utf-8' }), f.name);
          if (i < exportSummary.files.length - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
      toast.success(t('export.summary.redownloadSuccess', 'Download started again'));
    } catch (e) {
      console.error('Re-download error:', e);
      toast.error(t('export.summary.redownloadFailed', 'Failed to re-download'));
    } finally {
      setIsRedownloading(false);
    }
  }, [exportSummary, t]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || generations.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export to Stock Platforms
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-primary" />
            Optimized for 17+ platforms • Fast batch export
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'platforms' | 'preview' | 'quality')} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="platforms" className="gap-1.5 text-xs sm:text-sm">
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Platforms</span>
              <span className="sm:hidden">({filteredPlatforms.length})</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 text-xs sm:text-sm">
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Preview</span>
              {selectedPlatform && (
                <Badge variant="secondary" className="ml-1 text-[10px] hidden sm:inline-flex">
                  {selectedPlatform.icon}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quality" className="gap-1.5 text-xs sm:text-sm">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Quality</span>
              {qualityIssues && qualityIssues.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px]">
                  {qualityIssues.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="mt-4 flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative mb-3 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search platforms..."
                value={platformSearchQuery}
                onChange={(e) => setPlatformSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-4">
              <RadioGroup
                value={selectedFormat}
                onValueChange={(value) => handleFormatSelect(value as ExportFormat)}
                className="space-y-2 pb-2"
              >
                {filteredPlatforms.map((platform) => (
                  <PlatformItem
                    key={platform.id}
                    platform={platform}
                    isSelected={selectedFormat === platform.id}
                    onSelect={() => handleFormatSelect(platform.id)}
                  />
                ))}
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <AnimatePresence mode="wait">
              {previewData && selectedPlatform ? (
                <motion.div
                  key={selectedFormat}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Platform Info */}
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
                    <span className="text-xl">{selectedPlatform.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedPlatform.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Max {selectedPlatform.maxKeywords} keywords • Title {selectedPlatform.maxTitleLength} chars
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {previewData.rows.length} items
                    </Badge>
                  </div>

                  {/* CSV Headers */}
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">CSV COLUMNS</p>
                    <div className="flex flex-wrap gap-1">
                      {previewData.headers.map((header, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {header}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Important Instructions */}
                  <div className="mb-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <p className="text-xs font-medium text-warning">{t('export.importantInstructions')}</p>
                    </div>
                    <div className="space-y-1.5 ml-6">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span><strong>UTF-8 Encoding:</strong> {t('export.utf8Encoding')}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span><strong>Excel/Sheets:</strong> {t('export.excelSheets')}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <ImageIcon className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span><strong>Upload Order:</strong> {t('export.uploadOrder')}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                        <span><strong>Filename:</strong> {t('export.filenameMatch')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Items - Show all items with expandable details */}
                  <div className="h-[220px] overflow-y-auto pr-2">
                    <div className="space-y-2">
                      {previewData.rows.map((row, rowIndex) => (
                        <PreviewRow 
                          key={rowIndex} 
                          row={row} 
                          headers={previewData.headers} 
                          index={rowIndex} 
                          selectedFormat={selectedFormat}
                          isExpanded={expandedRows.has(rowIndex)}
                          onToggle={() => {
                            const newExpanded = new Set(expandedRows);
                            if (newExpanded.has(rowIndex)) {
                              newExpanded.delete(rowIndex);
                            } else {
                              newExpanded.add(rowIndex);
                            }
                            setExpandedRows(newExpanded);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No data to preview</p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="quality" className="mt-4 flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* Scan Button - Fixed at top */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/50 flex-shrink-0">
              <div className="flex-1">
                <p className="font-medium text-sm">{t('export.qualityCheck')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('export.qualityCheckDesc')}
                </p>
              </div>
              <Button
                onClick={handleQualityScan}
                disabled={isScanning}
                size="sm"
                variant="outline"
                className="gap-2 w-full sm:w-auto"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('export.scanning')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {t('export.scanNow')}
                  </>
                )}
              </Button>
            </div>

            {/* Results - Scrollable area */}
            <div className="flex-1 mt-4 overflow-y-auto" style={{ maxHeight: '280px' }}>
                <AnimatePresence mode="wait">
                  {qualityIssues === null ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{t('export.clickToScan')}</p>
                    </motion.div>
                  ) : qualityIssues.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                      </div>
                      <p className="font-medium text-success">{t('export.allClean')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('export.noForbiddenWords')}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-2"
                    >
                      {/* Issue Summary with Auto-fix Button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center gap-2 flex-1">
                          <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                          <p className="text-sm font-medium text-destructive">
                            {t('export.issuesFound', { count: qualityIssues.length })}
                          </p>
                        </div>
                        {onUpdateMetadata && (
                          <Button
                            onClick={handleAutoFixAll}
                            disabled={isAutoFixing || isScanning}
                            size="sm"
                            variant="default"
                            className="gap-2 w-full sm:w-auto"
                          >
                            {isAutoFixing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('export.fixing')} {autoFixProgress}%
                              </>
                            ) : (
                              <>
                                <Wrench className="h-4 w-4" />
                                {t('export.autoFixAll')}
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Auto-fix Progress */}
                      {isAutoFixing && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-1"
                        >
                          <Progress value={autoFixProgress} className="h-1.5" />
                          <p className="text-xs text-muted-foreground text-center">
                            {t('export.removingWords')}
                          </p>
                        </motion.div>
                      )}

                      {/* Issue List */}
                      {qualityIssues.map((issue, index) => (
                        <motion.div
                          key={`${issue.id}-${issue.field}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono truncate max-w-[150px]">{issue.imageName}</span>
                                <Badge variant="outline" className="text-[10px]">{issue.field}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {issue.foundWords.map((word, i) => (
                                  <Badge key={i} variant="destructive" className="text-[10px]">
                                    "{word}"
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Progress */}
        {exportProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-1"
          >
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-medium">{exportStatus || 'Exporting...'}</span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-1.5" />
          </motion.div>
        )}

        {/* Export Action Section */}
        <div className="flex flex-col gap-3 pt-4 border-t mt-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filterSearchQuery?.trim() ? (
                <span>{generations.length} filtered item{generations.length !== 1 ? 's' : ''}</span>
              ) : (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-primary" />
                  All items will be exported
                </span>
              )}
            </div>
            {selectedPlatform && (
              <Badge variant="outline" className="gap-1">
                {selectedPlatform.icon} {selectedPlatform.name}
              </Badge>
            )}
          </div>

          {/* ZIP bundle toggle */}
          <label className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:border-primary/30 transition-colors">
            <input
              type="checkbox"
              checked={bundleAsZip}
              onChange={(e) => setBundleAsZip(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Archive className="h-3.5 w-3.5 text-primary" />
                Bundle multiple CSVs into a single ZIP
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recommended when export splits into 2+ files (over 5,000 rows). One download instead of many.
              </p>
            </div>
          </label>

          {/* Large prominent Download button */}
          <Button 
            onClick={handleExport} 
            disabled={isExporting || isLoadingAll} 
            size="lg"
            className="w-full gap-3 h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg"
          >
            {isExporting || isLoadingAll ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {isLoadingAll ? 'Loading all data...' : 'Exporting...'}
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Download / Export CSV
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Export Summary Dialog */}
    <Dialog open={!!exportSummary} onOpenChange={(open) => { if (!open) setExportSummary(null); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {t('export.summary.title', 'Export Complete')}
          </DialogTitle>
          <DialogDescription>
            {t('export.summary.subtitle', 'Your metadata has been exported successfully.')}
          </DialogDescription>
        </DialogHeader>

        {exportSummary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {t('export.summary.platform', 'Platform')}
                </p>
                <p className="text-sm font-semibold text-foreground mt-1 truncate">
                  {exportSummary.platformName}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {t('export.summary.totalItems', 'Total Items')}
                </p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {exportSummary.totalItems.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {t('export.summary.files', 'Files')}
                </p>
                <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-2">
                  {exportSummary.fileCount}
                  {exportSummary.isZip && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Archive className="h-3 w-3" />
                      ZIP
                    </Badge>
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {exportSummary.isZip
                    ? t('export.summary.zipSize', 'ZIP Size')
                    : t('export.summary.totalSize', 'Total Size')}
                </p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {formatBytes(exportSummary.totalSizeBytes)}
                </p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {t('export.summary.generatedAt', 'Generated')}: {exportSummary.generatedAt}
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/40 px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-foreground">
                  {t('export.summary.fileList', 'Files Included')}
                </p>
              </div>
              {exportSummary.files.length > 50 ? (
                <div style={{ height: 240 }}>
                  <VirtualList<SummaryFileRowProps>
                    rowComponent={SummaryFileRow}
                    rowCount={exportSummary.files.length}
                    rowHeight={SUMMARY_ROW_HEIGHT}
                    rowProps={{
                      files: exportSummary.files,
                      rowsLabel: t('export.summary.rows', 'rows'),
                      formatBytes,
                    }}
                    overscanCount={8}
                    style={{ width: '100%' }}
                  />
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {exportSummary.files.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 text-xs">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="flex-1 truncate font-mono text-foreground">{f.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {f.rows.toLocaleString()} {t('export.summary.rows', 'rows')}
                      </Badge>
                      <span className="text-muted-foreground shrink-0 tabular-nums w-16 text-right">
                        {formatBytes(f.sizeBytes)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Where to find downloaded files hint */}
            {(() => {
              const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
              const isChromium = /Chrome|Edg|Brave|Opera|OPR/.test(ua) && !/Firefox/.test(ua);
              const isFirefox = /Firefox/.test(ua);
              const isMac = /Mac|iPhone|iPad/.test(ua);
              const shortcut = isMac ? '⇧ + ⌘ + J' : 'Ctrl + J';
              const downloadsUrl = isChromium
                ? 'chrome://downloads'
                : isFirefox
                  ? 'about:downloads'
                  : '';

              const openDownloads = () => {
                if (downloadsUrl) {
                  try {
                    navigator.clipboard?.writeText(downloadsUrl);
                    toast.success(
                      t('export.summary.downloadsHintCopied', 'Downloads URL copied'),
                      {
                        description: t(
                          'export.summary.downloadsHintCopiedDesc',
                          'Paste it in your browser address bar, or press {{shortcut}}.',
                          { shortcut }
                        ),
                      }
                    );
                  } catch {
                    toast.info(
                      t('export.summary.downloadsHintTitle', 'Open Downloads'),
                      {
                        description: t(
                          'export.summary.downloadsHintShortcut',
                          'Press {{shortcut}} to open your browser Downloads.',
                          { shortcut }
                        ),
                      }
                    );
                  }
                } else {
                  toast.info(
                    t('export.summary.downloadsHintTitle', 'Open Downloads'),
                    {
                      description: t(
                        'export.summary.downloadsHintShortcut',
                        'Press {{shortcut}} to open your browser Downloads.',
                        { shortcut }
                      ),
                    }
                  );
                }
              };

              return (
                <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-3">
                  <FolderOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">
                      {t('export.summary.downloadsHintTitle', 'Where is my file?')}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t(
                        'export.summary.downloadsHintBody',
                        'Saved to your browser\'s default Downloads folder. Open it with {{shortcut}}.',
                        { shortcut }
                      )}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={openDownloads}
                      className="h-auto p-0 text-[11px] gap-1"
                    >
                      <Info className="h-3 w-3" />
                      {t('export.summary.showInDownloads', 'Show in Downloads')}
                    </Button>
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                onClick={() => setExportSummary(null)}
                variant="outline"
                className="flex-1"
              >
                {t('common.close', 'Close')}
              </Button>
              <Button
                onClick={handleReDownload}
                disabled={isRedownloading}
                className="flex-1 gap-2"
              >
                {isRedownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('export.summary.redownloading', 'Re-downloading...')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {t('export.summary.redownload', 'Re-download')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
import { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, Check, Search, Eye, List, Loader2, Zap, AlertCircle, FileText, Image as ImageIcon, CheckCircle2, ShieldCheck, XCircle, RefreshCw, Wrench } from 'lucide-react';
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

export function ExportDialog({ generations, disabled, fetchAllForExport, searchQuery: filterSearchQuery, exportOptions, onUpdateMetadata }: ExportDialogProps) {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('adobe_stock');
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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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
    if (generations.length === 0) {
      toast.error('No generations to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(10);

    try {
      let dataToExport = generations;
      
      // If there's no search filter and we have fetchAllForExport, fetch ALL generations
      if (!filterSearchQuery?.trim() && fetchAllForExport) {
        setIsLoadingAll(true);
        setExportProgress(20);
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

      // Adobe Stock: enforce 5000 row limit and 1MB file size (official guideline)
      const MAX_ROWS = 5000;
      if (selectedFormat === 'adobe_stock' && dataToExport.length > MAX_ROWS) {
        toast.warning(`Adobe Stock allows max ${MAX_ROWS} rows per CSV. Exporting first ${MAX_ROWS} of ${dataToExport.length} items. Split into multiple files for the rest.`, { duration: 6000 });
        dataToExport = dataToExport.slice(0, MAX_ROWS);
      }

      // Validate Adobe Stock export - prevent export if Title or Keywords are empty
      if (selectedFormat === 'adobe_stock') {
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

      const exportData = generateExport(selectedFormat, dataToExport, exportOptions);

      setExportProgress(80);
      const csv = [
        exportData.headers.join(','),
        ...exportData.rows.map(r => r.join(',')),
      ].join('\n');

      // Add BOM for Excel UTF-8 compatibility
      const BOM = '\uFEFF';
      const csvContent = BOM + csv;
      
      // Adobe Stock: enforce 1MB file size limit
      if (selectedFormat === 'adobe_stock' && new Blob([csvContent]).size > 1024 * 1024) {
        toast.error('CSV file exceeds Adobe Stock 1MB limit. Please reduce the number of items and try again.', { duration: 6000 });
        setIsExporting(false);
        setExportProgress(0);
        return;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportData.filename}-${new Date().toISOString().split('T')[0]}.csv`;
      
      setExportProgress(100);
      a.click();
      URL.revokeObjectURL(url);

      const platform = stockPlatforms.find(f => f.id === selectedFormat);
      toast.success(`✅ ${dataToExport.length} items exported for ${platform?.name}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
      setIsLoadingAll(false);
      setExportProgress(0);
    }
  }, [generations, filterSearchQuery, fetchAllForExport, selectedFormat, exportOptions]);

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

  return (
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
              <span>Exporting...</span>
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
                {isLoadingAll ? 'Loading all data...' : 'Exporting CSV...'}
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
  );
}
import { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, Check, Search, Eye, List, Loader2, Zap, AlertCircle, FileText, Image, CheckCircle2 } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  stockPlatforms, 
  generateExport, 
  type ExportFormat, 
  type Generation,
  type StockPlatform,
  type ExportOptions
} from '@/lib/stockPlatformFormats';

interface ExportDialogProps {
  generations: Generation[];
  disabled?: boolean;
  fetchAllForExport?: () => Promise<Generation[]>;
  searchQuery?: string;
  exportOptions?: ExportOptions;
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

// Memoized preview row component
const PreviewRow = memo(({ 
  row, 
  headers, 
  index 
}: { 
  row: string[]; 
  headers: string[]; 
  index: number;
}) => {
  const cleanValue = (val: string) => {
    if (!val) return '-';
    return val.replace(/^"|"$/g, '').replace(/""/g, '"');
  };

   // Find important fields indices
   const titleIndex = headers.findIndex(h => h.toLowerCase() === 'title' || h.toLowerCase() === 'headline' || h.toLowerCase() === 'description' || h.toLowerCase() === 'caption');
   const categoryIndex = headers.findIndex(h => h.toLowerCase() === 'category' || h.toLowerCase() === 'categories');
   const keywordsIndex = headers.findIndex(h => h.toLowerCase() === 'keywords' || h.toLowerCase() === 'tags');
 
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="p-3 rounded-lg border bg-card"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
        <span className="text-sm font-medium truncate">{cleanValue(row[0])}</span>
         {categoryIndex > -1 && cleanValue(row[categoryIndex]) !== '-' && (
           <Badge variant="secondary" className="text-[10px] ml-auto">
             Cat: {cleanValue(row[categoryIndex])}
           </Badge>
         )}
      </div>
      <div className="grid gap-1.5">
         {headers.slice(1).map((header, colIndex) => {
           const actualColIndex = colIndex + 1;
           // Skip showing Category separately in grid since we show it as badge
           if (header.toLowerCase() === 'category' || header.toLowerCase() === 'categories') {
             return null;
           }
           return (
           <div key={colIndex} className="flex gap-2 text-xs">
            <span className="text-muted-foreground min-w-[80px] flex-shrink-0">{header}:</span>
             <span className="text-foreground break-all line-clamp-2">{cleanValue(row[actualColIndex])}</span>
          </div>
           );
         })}
      </div>
    </motion.div>
  );
});
PreviewRow.displayName = 'PreviewRow';

export function ExportDialog({ generations, disabled, fetchAllForExport, searchQuery: filterSearchQuery, exportOptions }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('adobe_stock');
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [platformSearchQuery, setPlatformSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'platforms' | 'preview'>('platforms');
  const [exportProgress, setExportProgress] = useState(0);

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

  // Optimized export handler with progress tracking
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
      const exportData = generateExport(selectedFormat, dataToExport, exportOptions);

      setExportProgress(80);
      const csv = [
        exportData.headers.join(','),
        ...exportData.rows.map(r => r.join(',')),
      ].join('\n');

      // Add BOM for Excel UTF-8 compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
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

  // Reset state on dialog close
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPlatformSearchQuery('');
      setActiveTab('platforms');
      setExportProgress(0);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export to Stock Platforms
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-primary" />
            Optimized for 17+ platforms • Fast batch export
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'platforms' | 'preview')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platforms" className="gap-2">
              <List className="h-4 w-4" />
              Platforms ({filteredPlatforms.length})
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
              {selectedPlatform && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedPlatform.icon}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="mt-4">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search platforms..."
                value={platformSearchQuery}
                onChange={(e) => setPlatformSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <RadioGroup
                value={selectedFormat}
                onValueChange={(value) => handleFormatSelect(value as ExportFormat)}
                className="space-y-2"
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
            </ScrollArea>
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
                  <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">গুরুত্বপূর্ণ নির্দেশনা</p>
                    </div>
                    <div className="space-y-1.5 ml-6">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span><strong>UTF-8 Encoding:</strong> CSV ফাইল অবশ্যই UTF-8 encoded</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span><strong>Excel/Sheets:</strong> Save as → CSV UTF-8 (Comma delimited)</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Image className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        <span><strong>Upload Order:</strong> ছবি আগে আপলোড করুন, তারপর CSV</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                        <span><strong>Filename:</strong> Filename না মিললে metadata apply হবে না</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Items - Show only first 3 for performance */}
                  <ScrollArea className="h-[160px]">
                    <div className="space-y-3">
                      {previewData.rows.slice(0, 3).map((row, rowIndex) => (
                        <PreviewRow 
                          key={rowIndex} 
                          row={row} 
                          headers={previewData.headers} 
                          index={rowIndex} 
                        />
                      ))}
                      {previewData.rows.length > 3 && (
                        <div className="text-center py-3 text-xs text-muted-foreground border border-dashed rounded-lg">
                          +{previewData.rows.length - 3} more items will be exported
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </motion.div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No data to preview</p>
                </div>
              )}
            </AnimatePresence>
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

        <div className="flex items-center justify-between pt-2 border-t">
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
          <Button onClick={handleExport} disabled={isExporting || isLoadingAll} className="gap-2">
            {isExporting || isLoadingAll ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isLoadingAll ? 'Loading...' : 'Exporting...'}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
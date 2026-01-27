import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, Check, Search, Eye, List } from 'lucide-react';
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
import { toast } from 'sonner';
import { 
  stockPlatforms, 
  generateExport, 
  type ExportFormat, 
  type Generation 
} from '@/lib/stockPlatformFormats';

interface ExportDialogProps {
  generations: Generation[];
  disabled?: boolean;
}

export function ExportDialog({ generations, disabled }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('adobe_stock');
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'platforms' | 'preview'>('platforms');

  const filteredPlatforms = stockPlatforms.filter(platform =>
    platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPlatform = stockPlatforms.find(p => p.id === selectedFormat);
  const previewData = generations.length > 0 ? generateExport(selectedFormat, generations) : null;

  const handleExport = () => {
    if (generations.length === 0) {
      toast.error('No generations to export');
      return;
    }

    setIsExporting(true);

    try {
      const exportData = generateExport(selectedFormat, generations);

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
      a.click();
      URL.revokeObjectURL(url);

      const platform = stockPlatforms.find(f => f.id === selectedFormat);
      toast.success(`✅ ${generations.length} items exported for ${platform?.name}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Remove CSV escaping for preview display
  const cleanValue = (val: string) => {
    if (!val) return '-';
    return val.replace(/^"|"$/g, '').replace(/""/g, '"');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          <DialogDescription>
            Select platform and preview metadata before exporting.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'platforms' | 'preview')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platforms" className="gap-2">
              <List className="h-4 w-4" />
              Platforms
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <RadioGroup
                value={selectedFormat}
                onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
                className="space-y-2"
              >
                {filteredPlatforms.map((platform) => (
                  <motion.div
                    key={platform.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Label
                      htmlFor={platform.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedFormat === platform.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/30 hover:bg-muted/30'
                      }`}
                    >
                      <RadioGroupItem value={platform.id} id={platform.id} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{platform.icon}</span>
                          <span className="font-medium text-foreground">{platform.name}</span>
                          {selectedFormat === platform.id && (
                            <Check className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {platform.description}
                        </p>
                      </div>
                    </Label>
                  </motion.div>
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
                  transition={{ duration: 0.2 }}
                >
                  {/* Platform Info */}
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
                    <span className="text-xl">{selectedPlatform.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{selectedPlatform.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Max {selectedPlatform.maxKeywords} keywords • Title {selectedPlatform.maxTitleLength} chars
                      </p>
                    </div>
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

                  {/* Preview Items */}
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-3">
                      {previewData.rows.slice(0, 5).map((row, rowIndex) => (
                        <motion.div
                          key={rowIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: rowIndex * 0.05 }}
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-muted-foreground">
                              #{rowIndex + 1}
                            </span>
                            <span className="text-sm font-medium truncate">
                              {cleanValue(row[0])}
                            </span>
                          </div>
                          <div className="grid gap-1.5">
                            {previewData.headers.slice(1).map((header, colIndex) => (
                              <div key={colIndex} className="flex gap-2 text-xs">
                                <span className="text-muted-foreground min-w-[80px] flex-shrink-0">
                                  {header}:
                                </span>
                                <span className="text-foreground break-all line-clamp-2">
                                  {cleanValue(row[colIndex + 1])}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                      {previewData.rows.length > 5 && (
                        <p className="text-center text-xs text-muted-foreground py-2">
                          +{previewData.rows.length - 5} more items...
                        </p>
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

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {generations.length} item{generations.length !== 1 ? 's' : ''} to export
          </p>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Download className="h-4 w-4" />
                </motion.div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
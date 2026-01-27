import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Check, Search } from 'lucide-react';
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

  const filteredPlatforms = stockPlatforms.filter(platform =>
    platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export to Stock Platforms
          </DialogTitle>
          <DialogDescription>
            Select the platform format. Each follows platform-specific metadata guidelines.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search platforms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[350px] pr-4">
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

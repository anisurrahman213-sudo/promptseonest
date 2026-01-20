import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Check } from 'lucide-react';
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
import { toast } from 'sonner';

type ExportFormat = 'adobe_stock' | 'shutterstock' | 'freepik' | 'generic';

interface Generation {
  id: string;
  image_name: string;
  image_url: string;
  prompt: string;
  title: string;
  description: string;
  tags: string;
  created_at: string;
}

interface ExportDialogProps {
  generations: Generation[];
  disabled?: boolean;
}

const exportFormats = [
  {
    id: 'adobe_stock' as ExportFormat,
    name: 'Adobe Stock',
    description: 'Filename, Title, Keywords (max 25), Category',
    icon: '🅰️',
  },
  {
    id: 'shutterstock' as ExportFormat,
    name: 'Shutterstock',
    description: 'Filename, Description, Keywords (max 50), Categories, Editorial',
    icon: '📷',
  },
  {
    id: 'freepik' as ExportFormat,
    name: 'Freepik',
    description: 'Filename, Title, Tags, Type',
    icon: '🎨',
  },
  {
    id: 'generic' as ExportFormat,
    name: 'Generic (All Fields)',
    description: 'All metadata fields for custom use',
    icon: '📋',
  },
];

export function ExportDialog({ generations, disabled }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('adobe_stock');
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const escapeCSV = (text: string): string => {
    if (!text) return '""';
    // Escape quotes and wrap in quotes
    return `"${text.replace(/"/g, '""')}"`;
  };

  const limitKeywords = (tags: string, limit: number): string => {
    const keywords = tags.split(',').map(t => t.trim()).filter(Boolean);
    return keywords.slice(0, limit).join(', ');
  };

  const exportAdobeStock = () => {
    // Adobe Stock format: Filename, Title, Keywords (max 25)
    const headers = ['Filename', 'Title', 'Keywords'];
    const rows = generations.map(g => [
      escapeCSV(g.image_name),
      escapeCSV(g.title.slice(0, 60)), // Adobe Stock title max 60 chars
      escapeCSV(limitKeywords(g.tags, 25)), // Max 25 keywords
    ]);
    return { headers, rows, filename: 'adobe-stock-export' };
  };

  const exportShutterstock = () => {
    // Shutterstock format: Filename, Description, Keywords (max 50), Categories, Editorial
    const headers = ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial'];
    const rows = generations.map(g => [
      escapeCSV(g.image_name),
      escapeCSV(g.description.slice(0, 200)), // Shutterstock description max 200 chars
      escapeCSV(limitKeywords(g.tags, 50)), // Max 50 keywords
      escapeCSV(''), // Categories - user fills in
      escapeCSV('no'), // Editorial - default no
    ]);
    return { headers, rows, filename: 'shutterstock-export' };
  };

  const exportFreepik = () => {
    // Freepik format: Filename, Title, Tags, Type
    const headers = ['Filename', 'Title', 'Tags', 'Type'];
    const rows = generations.map(g => [
      escapeCSV(g.image_name),
      escapeCSV(g.title),
      escapeCSV(g.tags),
      escapeCSV('photo'), // Default type
    ]);
    return { headers, rows, filename: 'freepik-export' };
  };

  const exportGeneric = () => {
    // Generic format: All fields
    const headers = ['Filename', 'Title', 'Description', 'Keywords', 'AI Prompt', 'Created At'];
    const rows = generations.map(g => [
      escapeCSV(g.image_name),
      escapeCSV(g.title),
      escapeCSV(g.description),
      escapeCSV(g.tags),
      escapeCSV(g.prompt),
      escapeCSV(new Date(g.created_at).toISOString()),
    ]);
    return { headers, rows, filename: 'metadata-export' };
  };

  const handleExport = () => {
    if (generations.length === 0) {
      toast.error('No generations to export');
      return;
    }

    setIsExporting(true);

    try {
      let exportData: { headers: string[]; rows: string[][]; filename: string };

      switch (selectedFormat) {
        case 'adobe_stock':
          exportData = exportAdobeStock();
          break;
        case 'shutterstock':
          exportData = exportShutterstock();
          break;
        case 'freepik':
          exportData = exportFreepik();
          break;
        case 'generic':
        default:
          exportData = exportGeneric();
          break;
      }

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

      toast.success(`Exported ${generations.length} items for ${exportFormats.find(f => f.id === selectedFormat)?.name}`);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export to CSV
          </DialogTitle>
          <DialogDescription>
            Select the platform format for your CSV export. Each platform has specific column requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedFormat}
            onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
            className="space-y-3"
          >
            {exportFormats.map((format) => (
              <motion.div
                key={format.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Label
                  htmlFor={format.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedFormat === format.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }`}
                >
                  <RadioGroupItem value={format.id} id={format.id} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{format.icon}</span>
                      <span className="font-medium text-foreground">{format.name}</span>
                      {selectedFormat === format.id && (
                        <Check className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format.description}
                    </p>
                  </div>
                </Label>
              </motion.div>
            ))}
          </RadioGroup>
        </div>

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

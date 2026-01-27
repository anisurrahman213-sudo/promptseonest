import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface User {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  credits: number | null;
  created_at: string | null;
}

interface UserListExportProps {
  users: User[];
  filename?: string;
}

export function UserListExport({ users, filename = 'users' }: UserListExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return '';
    }
  };

  const generateCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Credits', 'Signup Date'];
    
    const rows = users.map(user => [
      user.full_name || '',
      user.email || '',
      user.phone_number || '',
      String(user.credits ?? 0),
      formatDate(user.created_at),
    ]);

    // Escape values that might contain commas or quotes
    const escapeValue = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeValue).join(',')),
    ].join('\n');

    return csvContent;
  };

  const downloadFile = (content: string, fileExtension: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    if (users.length === 0) {
      toast.error('No users to export');
      return;
    }

    setIsExporting(true);
    try {
      const csvContent = generateCSV();
      downloadFile(csvContent, 'csv', 'text/csv;charset=utf-8;');
      toast.success(`Exported ${users.length} users to CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (users.length === 0) {
      toast.error('No users to export');
      return;
    }

    setIsExporting(true);
    try {
      // For Excel, we'll create a TSV that Excel can open, or use CSV with BOM for better Excel compatibility
      const headers = ['Name', 'Email', 'Phone', 'Credits', 'Signup Date'];
      
      const rows = users.map(user => [
        user.full_name || '',
        user.email || '',
        user.phone_number || '',
        String(user.credits ?? 0),
        formatDate(user.created_at),
      ]);

      // Tab-separated values work better with Excel
      const tsvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t')),
      ].join('\n');

      // Add BOM for Excel UTF-8 compatibility
      const bom = '\uFEFF';
      downloadFile(bom + tsvContent, 'xls', 'application/vnd.ms-excel;charset=utf-8;');
      toast.success(`Exported ${users.length} users to Excel`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting || users.length === 0}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

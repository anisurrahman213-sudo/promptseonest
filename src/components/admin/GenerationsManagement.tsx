import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Trash2, 
  Search, 
  ImageIcon, 
  RefreshCw,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface Generation {
  id: string;
  title: string;
  image_url: string;
  image_name: string;
  user_id: string;
  created_at: string;
  description: string;
  tags: string;
}

export function GenerationsManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Fetch all generations (admin can see all)
  const { data: generations, isLoading, refetch } = useQuery({
    queryKey: ['admin-generations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as Generation[];
    },
  });

  // Delete single generation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First get the generation to find the image path
      const gen = generations?.find(g => g.id === id);
      
      // Delete from database
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Try to delete the image from storage if exists
      if (gen?.image_url) {
        try {
          const url = new URL(gen.image_url);
          const pathMatch = url.pathname.match(/\/images\/(.+)/);
          if (pathMatch) {
            await supabase.storage.from('images').remove([pathMatch[1]]);
          }
        } catch (e) {
          console.log('Could not delete storage file:', e);
        }
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-generations'] });
      toast.success('Generation deleted successfully');
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete generation');
    },
  });

  // Bulk delete generations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Get all generations to delete for storage cleanup
      const gensToDelete = generations?.filter(g => ids.includes(g.id)) || [];

      // Delete from database
      const { error } = await supabase
        .from('generations')
        .delete()
        .in('id', ids);

      if (error) throw error;

      // Try to delete images from storage
      for (const gen of gensToDelete) {
        if (gen.image_url) {
          try {
            const url = new URL(gen.image_url);
            const pathMatch = url.pathname.match(/\/images\/(.+)/);
            if (pathMatch) {
              await supabase.storage.from('images').remove([pathMatch[1]]);
            }
          } catch (e) {
            console.log('Could not delete storage file:', e);
          }
        }
      }

      return ids;
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: ['admin-generations'] });
      toast.success(`${ids.length} generations deleted successfully`);
      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete generations');
    },
  });

  const handleSingleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmSingleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!filteredGenerations) return;
    
    if (selectedIds.size === filteredGenerations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGenerations.map(g => g.id)));
    }
  };

  // Filter generations by search query
  const filteredGenerations = generations?.filter(gen => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      gen.title.toLowerCase().includes(query) ||
      gen.image_name.toLowerCase().includes(query) ||
      gen.description.toLowerCase().includes(query) ||
      gen.tags.toLowerCase().includes(query)
    );
  });

  const totalCount = generations?.length || 0;
  const filteredCount = filteredGenerations?.length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              All Generations
            </CardTitle>
            <CardDescription>
              Manage all processed images ({totalCount} total)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Select All */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, filename, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredGenerations && filteredGenerations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="shrink-0"
            >
              {selectedIds.size === filteredGenerations.length ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Select All ({filteredCount})
                </>
              )}
            </Button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filteredGenerations || filteredGenerations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{searchQuery ? 'No generations match your search' : 'No generations found'}</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredGenerations.length && filteredGenerations.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Filename</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGenerations.map((gen) => (
                  <TableRow key={gen.id} className={selectedIds.has(gen.id) ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(gen.id)}
                        onCheckedChange={() => toggleSelection(gen.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                        <img
                          src={gen.image_url}
                          alt={gen.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate">{gen.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          ID: {gen.id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="font-mono text-xs">
                        {gen.image_name.length > 25 
                          ? gen.image_name.slice(0, 25) + '...' 
                          : gen.image_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {format(new Date(gen.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSingleDelete(gen.id)}
                        disabled={deleteMutation.isPending && deletingId === gen.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deleteMutation.isPending && deletingId === gen.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Single Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Generation?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this generation and its associated image. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSingleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete {selectedIds.size} Generations?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected generations and their associated images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size} Items`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

import { memo, useState, useEffect, useCallback } from 'react';
import { GenerationCard } from '@/components/GenerationCard';
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger';
import { Generation } from '@/hooks/useInfiniteGenerations';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, CheckSquare, Square, X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VirtualGenerationListProps {
  generations: Generation[];
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => Promise<{ success: number; failed: number }>;
  hasMore: boolean;
  loadMore: () => void;
  loadingMore: boolean;
}

// Memoized card component to prevent unnecessary re-renders
const MemoizedGenerationCard = memo(GenerationCard);

export function VirtualGenerationList({
  generations,
  onDelete,
  onBulkDelete,
  hasMore,
  loadMore,
  loadingMore,
}: VirtualGenerationListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle shortcuts when in selection mode
    if (!isSelectionMode) return;

    // Ctrl/Cmd + A to select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      setSelectedIds(new Set(generations.map(g => g.id)));
    }

    // Delete or Backspace to delete selected
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0 && !isDeleting) {
      e.preventDefault();
      const confirmMessage = `Are you sure you want to delete ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`;
      if (confirm(confirmMessage)) {
        setIsDeleting(true);
        onBulkDelete(Array.from(selectedIds)).then((result) => {
          setIsDeleting(false);
          if (result.success > 0) {
            setSelectedIds(new Set());
            if (generations.length - result.success === 0) {
              setIsSelectionMode(false);
            }
          }
        });
      }
    }

    // Escape to exit selection mode
    if (e.key === 'Escape') {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  }, [isSelectionMode, generations, selectedIds, isDeleting, onBulkDelete]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(generations.map(g => g.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;
    
    setIsDeleting(true);
    const result = await onBulkDelete(Array.from(selectedIds));
    setIsDeleting(false);
    
    if (result.success > 0) {
      setSelectedIds(new Set());
      if (generations.length - result.success === 0) {
        setIsSelectionMode(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <AnimatePresence>
        {isSelectionMode ? (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 border border-border"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSelectionMode}
                className="h-8 gap-1.5"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} of {generations.length} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectedIds.size === generations.length ? deselectAll : selectAll}
                className="h-8 gap-1.5"
              >
                {selectedIds.size === generations.length ? (
                  <>
                    <Square className="h-3.5 w-3.5" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" />
                    Select All
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || isDeleting}
                className="h-8 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectionMode(true)}
              className="h-8 gap-1.5"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Select
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                  <Keyboard className="h-3 w-3" />
                  <span className="hidden sm:inline">Shortcuts</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="space-y-1">
                  <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+A</kbd> Select All</p>
                  <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Delete</kbd> Delete Selected</p>
                  <p><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Exit Selection</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <AnimatePresence mode="popLayout">
          {generations.map((generation, index) => (
            <motion.div
              key={generation.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                duration: 0.3, 
                delay: Math.min(index * 0.05, 0.3),
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              layout
              className="relative"
            >
              {/* Selection Checkbox Overlay */}
              {isSelectionMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "absolute top-2 left-2 z-20 p-1 rounded-md bg-background/90 backdrop-blur-sm border shadow-md cursor-pointer",
                    selectedIds.has(generation.id) 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(generation.id);
                  }}
                >
                  <Checkbox
                    checked={selectedIds.has(generation.id)}
                    onCheckedChange={() => toggleSelection(generation.id)}
                    className="h-5 w-5"
                  />
                </motion.div>
              )}
              
              {/* Selection Highlight Border */}
              <div
                className={cn(
                  "rounded-xl transition-all duration-200",
                  isSelectionMode && selectedIds.has(generation.id) 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                    : ""
                )}
              >
                <MemoizedGenerationCard
                  generation={generation}
                  onDelete={onDelete}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <InfiniteScrollTrigger
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoading={loadingMore}
        />
      )}
    </div>
  );
}

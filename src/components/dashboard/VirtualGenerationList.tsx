import { useRef, useCallback, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GenerationCard } from '@/components/GenerationCard';
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger';
import { Generation } from '@/hooks/useInfiniteGenerations';
import { motion, AnimatePresence } from 'framer-motion';

interface VirtualGenerationListProps {
  generations: Generation[];
  onDelete: (id: string) => void;
  hasMore: boolean;
  loadMore: () => void;
  loadingMore: boolean;
}

// Memoized card component to prevent unnecessary re-renders
const MemoizedGenerationCard = memo(GenerationCard);

export function VirtualGenerationList({
  generations,
  onDelete,
  hasMore,
  loadMore,
  loadingMore,
}: VirtualGenerationListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Estimate row height - cards are roughly 160px with margins
  const estimateSize = useCallback(() => 180, []);

  const virtualizer = useVirtualizer({
    count: generations.length + (hasMore ? 1 : 0), // +1 for loading trigger
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Render 5 extra items above/below viewport
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="popLayout">
          {items.map((virtualRow) => {
            const isLoaderRow = virtualRow.index >= generations.length;
            const generation = generations[virtualRow.index];

            return (
              <motion.div
                key={isLoaderRow ? 'loader' : generation.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <InfiniteScrollTrigger
                    onLoadMore={loadMore}
                    hasMore={hasMore}
                    isLoading={loadingMore}
                  />
                ) : (
                  <div className="pb-4">
                    <MemoizedGenerationCard
                      generation={generation}
                      onDelete={onDelete}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

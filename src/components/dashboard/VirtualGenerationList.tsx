import { memo } from 'react';
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
  return (
    <div className="space-y-4">
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
            >
              <MemoizedGenerationCard
                generation={generation}
                onDelete={onDelete}
              />
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

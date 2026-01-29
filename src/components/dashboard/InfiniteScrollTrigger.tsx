import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function InfiniteScrollTrigger({ 
  onLoadMore, 
  hasMore, 
  isLoading 
}: InfiniteScrollTriggerProps) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        rootMargin: '200px', // Load 200px before reaching the bottom
        threshold: 0.1,
      }
    );

    const currentRef = triggerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [onLoadMore, hasMore, isLoading]);

  if (!hasMore && !isLoading) {
    return (
      <motion.div 
        className="text-center py-8 text-muted-foreground text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {t('dashboard.allLoaded')} ✨
      </motion.div>
    );
  }

  return (
    <div ref={triggerRef} className="py-8">
      {isLoading && (
        <motion.div 
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{t('dashboard.loadingMore')}</span>
        </motion.div>
      )}
    </div>
  );
}

import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  
  const pullProgress = useTransform(pullDistance, [0, PULL_THRESHOLD], [0, 1]);
  const rotation = useTransform(pullDistance, [0, PULL_THRESHOLD], [0, 180]);
  const opacity = useTransform(pullDistance, [0, 40, PULL_THRESHOLD], [0, 0.5, 1]);
  const scale = useTransform(pullDistance, [0, PULL_THRESHOLD], [0.5, 1]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only enable pull-to-refresh when scrolled to top
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      startY.current = 0;
      pullDistance.set(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance as pull increases
      const resistance = 1 - Math.min(diff / (MAX_PULL * 2), 0.7);
      const adjustedPull = Math.min(diff * resistance, MAX_PULL);
      pullDistance.set(adjustedPull);
      
      // Prevent default scroll when pulling down
      if (adjustedPull > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, isRefreshing, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    const currentPull = pullDistance.get();
    
    if (currentPull >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    // Reset pull distance with animation
    animate(pullDistance, 0, { duration: 0.3, ease: 'easeOut' });
    startY.current = 0;
  }, [disabled, isRefreshing, pullDistance, onRefresh]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        style={{ 
          top: useTransform(pullDistance, [0, MAX_PULL], [-40, 20]),
          opacity,
          scale,
        }}
      >
        <motion.div
          className="w-10 h-10 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center border border-primary/20"
          style={{ rotate: isRefreshing ? undefined : rotation }}
          animate={isRefreshing ? { rotate: 360 } : undefined}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : undefined}
        >
          <RefreshCw className="w-5 h-5 text-primary" />
        </motion.div>
      </motion.div>

      {/* Content with pull transform */}
      <motion.div
        style={{ 
          y: useTransform(pullDistance, [0, MAX_PULL], [0, MAX_PULL / 2]),
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

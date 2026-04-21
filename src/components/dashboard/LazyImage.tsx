import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  /** How many times to auto-retry a failed load before showing the manual button. */
  maxAutoRetries?: number;
}

const RETRY_DELAYS_MS = [800, 1600, 3200]; // exponential backoff

export function LazyImage({
  src,
  alt,
  className,
  skeletonClassName,
  maxAutoRetries = 3,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  // Cache-busting token appended to src to force a fresh fetch on retry
  const [cacheBust, setCacheBust] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const retryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Reset state when the src prop itself changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setRetryCount(0);
    setCacheBust(0);
  }, [src]);

  // Cleanup any pending retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const triggerRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    setCacheBust((n) => n + 1);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);

    if (retryCount < maxAutoRetries) {
      const delay = RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
      retryTimerRef.current = window.setTimeout(() => {
        setRetryCount((n) => n + 1);
        triggerRetry();
      }, delay);
    }
  }, [retryCount, maxAutoRetries, triggerRetry]);

  const handleManualRetry = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setRetryCount(0);
    triggerRetry();
  }, [triggerRetry]);

  // Append cache-buster only on retries so first paint stays cache-friendly
  const effectiveSrc = cacheBust > 0
    ? `${src}${src.includes('?') ? '&' : '?'}_r=${cacheBust}`
    : src;

  const isAutoRetrying = hasError && retryCount < maxAutoRetries;
  const showManualRetry = hasError && retryCount >= maxAutoRetries;

  return (
    <div className={cn('relative overflow-hidden', className)} ref={containerRef}>
      {!isLoaded && !hasError && (
        <Skeleton className={cn('absolute inset-0', skeletonClassName)} />
      )}

      {isAutoRetrying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80 backdrop-blur-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Retrying… ({retryCount + 1}/{maxAutoRetries})
          </span>
        </div>
      )}

      {showManualRetry && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
          <span className="text-xs text-muted-foreground">Failed to load</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleManualRetry}
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh preview
          </Button>
        </div>
      )}

      {isInView && (
        <img
          // key forces React to remount the <img>, ensuring onLoad/onError fire again
          key={cacheBust}
          src={effectiveSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => {
            setIsLoaded(true);
            setHasError(false);
          }}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}

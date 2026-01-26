import { useState, useEffect } from 'react';
import { useBackgroundProcessor } from '@/contexts/BackgroundProcessorContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, X, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function BackgroundProcessingIndicator() {
  const { currentJob, clearJob } = useBackgroundProcessor();
  const [isExpanded, setIsExpanded] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time
  useEffect(() => {
    if (!currentJob?.isProcessing) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - currentJob.startedAt);
    }, 100);

    return () => clearInterval(interval);
  }, [currentJob?.isProcessing, currentJob?.startedAt]);

  if (!currentJob) return null;

  const progressPercent = (currentJob.completedFiles / currentJob.totalFiles) * 100;
  const isComplete = !currentJob.isProcessing;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl overflow-hidden">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              {currentJob.isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Loader2 className="h-4 w-4 text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check className="h-4 w-4 text-success" />
                </motion.div>
              )}
              <span className="font-medium text-sm">
                {currentJob.isProcessing ? 'Processing...' : 'Complete!'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentJob.completedFiles}/{currentJob.totalFiles}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-3 py-2">
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-2">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-success">
                        <Check className="h-3 w-3" />
                        {currentJob.successCount}
                      </span>
                      <span className="flex items-center gap-1 text-destructive">
                        <X className="h-3 w-3" />
                        {currentJob.errorCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      {formatTime(elapsedTime)}
                    </div>
                  </div>

                  {/* File List (max 5 visible) */}
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {currentJob.files.slice(0, 5).map((file) => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30"
                      >
                        <span className="truncate flex-1 mr-2">{file.name}</span>
                        {file.status === 'pending' && (
                          <span className="text-muted-foreground">Waiting</span>
                        )}
                        {file.status === 'processing' && (
                          <Loader2 className="h-3 w-3 text-primary animate-spin" />
                        )}
                        {file.status === 'success' && (
                          <Check className="h-3 w-3 text-success" />
                        )}
                        {file.status === 'error' && (
                          <X className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    ))}
                    {currentJob.files.length > 5 && (
                      <div className="text-xs text-center text-muted-foreground py-1">
                        +{currentJob.files.length - 5} more files
                      </div>
                    )}
                  </div>

                  {/* Clear Button (when complete) */}
                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => clearJob()}
                      >
                        Dismiss
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

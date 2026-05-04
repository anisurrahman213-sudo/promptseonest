import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Clock, Timer, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { UploadErrorCategory } from '@/lib/uploadErrorMessages';

export interface ProcessingFile {
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  errorHint?: string;
  errorCategory?: UploadErrorCategory;
  startTime?: number;
  endTime?: number;
}

interface BulkProgressProps {
  files: ProcessingFile[];
  currentIndex: number;
  isProcessing: boolean;
}

// Live timer hook for processing files
function useProcessingTimer(file: ProcessingFile) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (file.status === 'processing' && file.startTime) {
      // Start live timer
      const updateElapsed = () => {
        setElapsed(Date.now() - file.startTime!);
      };
      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 100); // Update every 100ms
    } else if (file.status === 'success' || file.status === 'error') {
      // Stop timer and show final time
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (file.startTime && file.endTime) {
        setElapsed(file.endTime - file.startTime);
      }
    } else {
      setElapsed(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [file.status, file.startTime, file.endTime]);

  return elapsed;
}

// Format milliseconds to human readable format
function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSeconds}s`;
}

// Individual file row with timer
function ProcessingFileRow({ file, index }: { file: ProcessingFile; index: number }) {
  const elapsed = useProcessingTimer(file);

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors",
        file.status === 'processing' && "bg-primary/10 border border-primary/20",
        file.status === 'success' && "bg-green-500/5",
        file.status === 'error' && "bg-destructive/5",
        file.status === 'pending' && "opacity-50"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 }}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {file.status === 'processing' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 className="h-4 w-4 text-primary" />
          </motion.div>
        )}
        {file.status === 'success' && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        {file.status === 'error' && (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        {file.status === 'pending' && (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{file.name}</p>
        {file.status === 'error' && file.errorMessage && (
          <div className="flex items-start gap-1 mt-0.5">
            <AlertCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-destructive text-xs font-medium truncate">{file.errorMessage}</p>
              {file.errorHint && (
                <p className="text-muted-foreground text-[10px] sm:text-xs truncate">{file.errorHint}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live Timer */}
      {(file.status === 'processing' || file.status === 'success' || file.status === 'error') && elapsed > 0 && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium shrink-0",
          file.status === 'processing' && "bg-primary/20 text-primary animate-pulse",
          file.status === 'success' && "bg-green-500/20 text-green-600",
          file.status === 'error' && "bg-destructive/20 text-destructive"
        )}>
          <Timer className="h-3 w-3" />
          <span>{formatTime(elapsed)}</span>
        </div>
      )}

      {/* Index */}
      <span className="text-muted-foreground text-xs shrink-0">
        #{index + 1}
      </span>
    </motion.div>
  );
}

export function BulkProgress({ files, currentIndex, isProcessing }: BulkProgressProps) {
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [batchStartTime] = useState(() => Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'success' || f.status === 'error').length;
  const successFiles = files.filter(f => f.status === 'success').length;
  const errorFiles = files.filter(f => f.status === 'error').length;
  const pendingFiles = files.filter(f => f.status === 'pending').length;
  
  const progressPercent = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  // Calculate average processing time
  const completedWithTime = files.filter(f => 
    (f.status === 'success' || f.status === 'error') && f.startTime && f.endTime
  );
  const avgTime = completedWithTime.length > 0 
    ? completedWithTime.reduce((sum, f) => sum + (f.endTime! - f.startTime!), 0) / completedWithTime.length
    : 0;

  // Total batch timer
  useEffect(() => {
    if (isProcessing) {
      intervalRef.current = setInterval(() => {
        setTotalElapsed(Date.now() - batchStartTime);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isProcessing, batchStartTime]);

  if (!isProcessing && files.length === 0) return null;

  return (
    <motion.div
      className="rounded-xl sm:rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 sm:p-6 space-y-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="shrink-0"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
                <Loader2 className="h-6 w-6 text-primary relative" />
              </div>
            </motion.div>
          ) : (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          )}
          <div>
            <h3 className="font-semibold text-sm sm:text-base">
              {isProcessing ? 'Processing Files...' : 'Processing Complete'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isProcessing 
                ? `Processing ${currentIndex + 1} of ${totalFiles}`
                : `Completed ${successFiles} of ${totalFiles} files`
              }
            </p>
          </div>
        </div>

        {/* Total time and stats badges */}
        <div className="flex items-center gap-2">
          {/* Total elapsed time */}
          {totalElapsed > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-mono font-medium">
              <Timer className="h-3 w-3" />
              {formatTime(totalElapsed)}
            </div>
          )}
          {successFiles > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3" />
              {successFiles}
            </div>
          )}
          {errorFiles > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
              <XCircle className="h-3 w-3" />
              {errorFiles}
            </div>
          )}
          {pendingFiles > 0 && isProcessing && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <Clock className="h-3 w-3" />
              {pendingFiles}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2 sm:h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(progressPercent)}% complete</span>
          <div className="flex items-center gap-3">
            {avgTime > 0 && (
              <span className="text-primary">Avg: {formatTime(avgTime)}/file</span>
            )}
            <span>{completedFiles} / {totalFiles} files</span>
          </div>
        </div>
      </div>

      {/* File list - show last 5 */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
        {files.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((file, idx) => {
          const actualIndex = Math.max(0, currentIndex - 2) + idx;
          return (
            <ProcessingFileRow 
              key={`${file.name}-${actualIndex}`}
              file={file}
              index={actualIndex}
            />
          );
        })}
      </div>

      {/* Estimated time remaining */}
      {isProcessing && pendingFiles > 0 && (
        <motion.div 
          className="text-center text-xs text-muted-foreground pt-2 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {avgTime > 0 
            ? `Estimated time remaining: ~${formatTime(avgTime * pendingFiles)}`
            : `Estimated time remaining: ~${Math.ceil(pendingFiles * 3)} seconds`
          }
        </motion.div>
      )}
    </motion.div>
  );
}

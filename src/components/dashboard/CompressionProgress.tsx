import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, SkipForward, Timer, Zap, Rocket } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CompressionProgress as CompressionProgressType } from '@/lib/imageCompression';

interface CompressionProgressProps {
  files: CompressionProgressType[];
  isCompressing: boolean;
}

// Extended type to include video compression fields
interface ExtendedCompressionProgress extends CompressionProgressType {
  method?: 'webcodecs' | 'mediarecorder' | 'skipped';
  speedup?: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const CompressionFileRow = forwardRef<HTMLDivElement, { file: ExtendedCompressionProgress }>(
  ({ file }, ref) => {
    const elapsed = file.endTime && file.startTime 
      ? file.endTime - file.startTime 
      : file.startTime ? Date.now() - file.startTime : 0;
    
    const reduction = file.compressedSize && file.originalSize > file.compressedSize
      ? Math.round((1 - file.compressedSize / file.originalSize) * 100)
      : 0;

    return (
      <motion.div
        ref={ref}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
          file.status === 'compressing' && "bg-primary/10 border border-primary/20",
          file.status === 'done' && "bg-green-500/5",
          file.status === 'skipped' && "bg-muted/50",
          file.status === 'error' && "bg-destructive/5",
          file.status === 'pending' && "opacity-40"
        )}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* Status icon */}
        <div className="shrink-0">
          {file.status === 'compressing' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
            >
              <Loader2 className="h-3.5 w-3.5 text-primary" />
            </motion.div>
          )}
          {file.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
          {file.status === 'skipped' && <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />}
          {file.status === 'error' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
          {file.status === 'pending' && <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />}
        </div>
        
        {/* File name */}
        <span className="flex-1 truncate font-medium">{file.fileName}</span>
        
        {/* Size info */}
        <span className="text-muted-foreground shrink-0">
          {formatSize(file.originalSize)}
          {file.compressedSize && file.status === 'done' && (
            <span className="text-green-600 ml-1">→ {formatSize(file.compressedSize)}</span>
          )}
        </span>
        
        {/* Reduction badge */}
        {reduction > 0 && file.status === 'done' && (
          <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-600 font-mono text-[10px]">
            -{reduction}%
          </span>
        )}
        
        {/* WebCodecs speedup badge */}
        {file.method === 'webcodecs' && file.speedup && file.speedup > 1 && file.status === 'done' && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 font-mono text-[10px]">
            <Rocket className="h-2.5 w-2.5" />
            {file.speedup.toFixed(1)}x
          </span>
        )}
        
        {/* Timer */}
        {elapsed > 0 && (
          <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono shrink-0",
            file.status === 'compressing' && "bg-primary/20 text-primary",
            file.status === 'done' && "bg-green-500/15 text-green-600",
            file.status === 'skipped' && "bg-muted text-muted-foreground",
            file.status === 'error' && "bg-destructive/15 text-destructive"
          )}>
            <Timer className="h-2.5 w-2.5" />
            {formatTime(elapsed)}
          </div>
        )}
      </motion.div>
    );
  }
);

CompressionFileRow.displayName = 'CompressionFileRow';

export function CompressionProgress({ files, isCompressing }: CompressionProgressProps) {
  const completed = files.filter(f => f.status === 'done' || f.status === 'skipped' || f.status === 'error').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const skippedCount = files.filter(f => f.status === 'skipped').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const progress = files.length > 0 ? (completed / files.length) * 100 : 0;
  
  // Calculate total savings
  const totalOriginal = files.reduce((sum, f) => sum + f.originalSize, 0);
  const totalCompressed = files.reduce((sum, f) => sum + (f.compressedSize || f.originalSize), 0);
  const totalSaved = totalOriginal - totalCompressed;
  
  // Calculate average time
  const completedWithTime = files.filter(f => f.startTime && f.endTime);
  const avgTime = completedWithTime.length > 0
    ? completedWithTime.reduce((sum, f) => sum + (f.endTime! - f.startTime!), 0) / completedWithTime.length
    : 0;

  if (files.length === 0) return null;

  return (
    <motion.div
      className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-orange-500/5 p-4 space-y-3"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCompressing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Zap className="h-5 w-5 text-amber-500" />
            </motion.div>
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          <div>
            <h3 className="font-semibold text-sm">
              {isCompressing ? 'Compressing Images...' : 'Compression Complete'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {completed} / {files.length} files
              {totalSaved > 0 && !isCompressing && (
                <span className="text-green-600 ml-2">
                  Saved {formatSize(totalSaved)}
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Stats badges */}
        <div className="flex items-center gap-1.5">
          {doneCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3" /> {doneCount}
            </span>
          )}
          {skippedCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <SkipForward className="h-3 w-3" /> {skippedCount}
            </span>
          )}
          {errorCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs font-medium">
              <XCircle className="h-3 w-3" /> {errorCount}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          {avgTime > 0 && <span>Avg: {formatTime(avgTime)}/file</span>}
        </div>
      </div>

      {/* File list - show around current processing */}
      <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
        {files.slice(Math.max(0, completed - 2), completed + 5).map((file, idx) => (
          <CompressionFileRow key={`${file.fileName}-${idx}`} file={file} />
        ))}
      </div>
    </motion.div>
  );
}

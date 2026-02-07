import { AlertTriangle, RefreshCw, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentIssue } from '@/lib/contentQualityFilter';

interface ContentQualityWarningProps {
  issues: ContentIssue[];
  onAutoFix: () => void;
  onDismiss: () => void;
  onReanalyze?: () => void;
  isFixing?: boolean;
  isReanalyzing?: boolean;
}

export function ContentQualityWarning({
  issues,
  onAutoFix,
  onDismiss,
  onReanalyze,
  isFixing = false,
  isReanalyzing = false,
}: ContentQualityWarningProps) {
  if (issues.length === 0) return null;

  const allFoundWords = issues.flatMap(issue => issue.foundWords);
  const uniqueWords = [...new Set(allFoundWords)];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-3"
      >
        {/* Header */}
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warning">
              সমস্যাযুক্ত শব্দ পাওয়া গেছে
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              এই শব্দগুলো stock platform-এ রিজেক্ট হতে পারে
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Found Words */}
        <div className="flex flex-wrap gap-1.5">
          {uniqueWords.map((word, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-[10px] bg-destructive/10 text-destructive border-destructive/20"
            >
              "{word}"
            </Badge>
          ))}
        </div>

        {/* Affected Fields */}
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">প্রভাবিত ক্ষেত্র: </span>
          {issues.map((issue, idx) => (
            <span key={issue.field}>
              {issue.field === 'title' && 'Title'}
              {issue.field === 'description' && 'Description'}
              {issue.field === 'tags' && 'Tags'}
              {issue.field === 'prompt' && 'Prompt'}
              {idx < issues.length - 1 && ', '}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="default"
            className="h-8 text-xs gap-1.5"
            onClick={onAutoFix}
            disabled={isFixing || isReanalyzing}
          >
            {isFixing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            স্বয়ংক্রিয় ফিক্স
          </Button>
          
          {onReanalyze && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={onReanalyze}
              disabled={isFixing || isReanalyzing}
            >
              {isReanalyzing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              পুনরায় বিশ্লেষণ
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

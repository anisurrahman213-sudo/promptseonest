import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, FileImage, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { ExportPlatform } from './AdvancedMetadataControls';
import { 
  platformRequirements, 
  type ValidationResult, 
  type ImageInfo 
} from '@/lib/platformValidation';

interface ValidationItem {
  fileName: string;
  info: ImageInfo;
  validation: ValidationResult;
}

interface ImageValidationResultsProps {
  platform: ExportPlatform;
  results: ValidationItem[];
  isValidating: boolean;
}

export function ImageValidationResults({ 
  platform, 
  results, 
  isValidating 
}: ImageValidationResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const req = platformRequirements[platform];

  if (isValidating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border bg-card"
      >
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Validating images against {req.name} requirements...</span>
        </div>
      </motion.div>
    );
  }

  if (results.length === 0) return null;

  const passedCount = results.filter(r => r.validation.isValid).length;
  const failedCount = results.length - passedCount;
  const passRate = (passedCount / results.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Summary Header */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">{req.icon}</span>
          <div className="flex-1">
            <p className="font-medium text-sm">{req.name} Validation</p>
            <p className="text-xs text-muted-foreground">
              {results.length} image{results.length !== 1 ? 's' : ''} checked
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
              <Check className="h-3 w-3" />
              {passedCount}
            </Badge>
            {failedCount > 0 && (
              <Badge variant="destructive" className="gap-1 bg-red-500/10 text-red-600 border-red-500/20">
                <X className="h-3 w-3" />
                {failedCount}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Pass Rate</span>
            <span className={passRate === 100 ? 'text-green-600' : passRate > 50 ? 'text-yellow-600' : 'text-red-600'}>
              {passRate.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={passRate} 
            className="h-2" 
          />
        </div>
      </div>

      {/* Individual Results */}
      <ScrollArea className="max-h-[300px]">
        <div className="space-y-2">
          <AnimatePresence>
            {results.map((result, index) => (
              <motion.div
                key={result.fileName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-3 rounded-lg border transition-colors ${
                  result.validation.isValid 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  <div className={`p-1.5 rounded-md ${
                    result.validation.isValid ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    {result.validation.isValid ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.info.width}×{result.info.height}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {expandedIndex === index ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 pt-3 border-t border-border/50"
                    >
                      <div className="grid gap-2">
                        {result.validation.checks.map((check, checkIndex) => (
                          <div 
                            key={checkIndex}
                            className={`flex items-start gap-2 p-2 rounded-md text-xs ${
                              check.passed 
                                ? 'bg-green-500/5' 
                                : check.name === 'AI Content Policy'
                                ? 'bg-yellow-500/10'
                                : 'bg-red-500/5'
                            }`}
                          >
                            <div className="mt-0.5">
                              {check.passed ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : check.name === 'AI Content Policy' ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{check.name}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-muted-foreground">
                                {check.value && (
                                  <span>Current: <span className="text-foreground">{check.value}</span></span>
                                )}
                                {check.required && (
                                  <span>Required: <span className="text-foreground">{check.required}</span></span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* AI Warning if applicable */}
      {!req.aiContentAllowed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            <strong>{req.name}</strong> does not accept AI-generated content. Ensure your images are original photographs.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

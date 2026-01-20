import { useState } from 'react';
import { Copy, Check, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Generation } from '@/hooks/useGenerations';
import { toast } from 'sonner';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface GenerationCardProps {
  generation: Generation;
  onDelete: (id: string) => void;
}

export function GenerationCard({ generation, onDelete }: GenerationCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this generation?')) {
      onDelete(generation.id);
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 sm:h-8 sm:w-8 shrink-0 touch-manipulation active:scale-90"
        onClick={() => copyToClipboard(text, field)}
      >
        <AnimatePresence mode="wait">
          {copiedField === field ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Check className="h-4 w-4 text-success" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Copy className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );

  const contentVariants: Variants = {
    hidden: { 
      opacity: 0, 
      height: 0,
    },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      layout
    >
      <Card className="overflow-hidden border-0 shadow-lg group">
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <CardHeader className="p-3 sm:p-5 pb-0">
            <div className="flex gap-3 sm:gap-4">
              <motion.div 
                className="relative w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-muted shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <img
                  src={generation.image_url}
                  alt={generation.image_name}
                  className="w-full h-full object-cover"
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
              <div className="flex-1 min-w-0 py-0.5 sm:py-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                    <h3 className="font-display font-bold text-sm sm:text-lg truncate pr-2">
                      {generation.image_name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-1.5">
                      <motion.span 
                        className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      />
                      {new Date(generation.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.1 }} 
                      whileTap={{ scale: 0.9 }}
                      animate={{ rotate: expanded ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 touch-manipulation"
                        onClick={() => setExpanded(!expanded)}
                      >
                        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                {/* Quick preview of title when collapsed */}
                <AnimatePresence>
                  {!expanded && (
                    <motion.p 
                      className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 line-clamp-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {generation.title}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {expanded && (
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <CardContent className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                  {/* Prompt */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px] sm:text-xs font-medium">
                        Prompt
                      </Badge>
                      <CopyButton text={generation.prompt} field="Prompt" />
                    </div>
                    <p className="text-xs sm:text-sm bg-muted/50 p-3 sm:p-4 rounded-lg sm:rounded-xl leading-relaxed">{generation.prompt}</p>
                  </motion.div>

                  {/* Title */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-secondary/10 text-secondary border-0 text-[10px] sm:text-xs font-medium">
                        Title
                      </Badge>
                      <CopyButton text={generation.title} field="Title" />
                    </div>
                    <p className="text-xs sm:text-sm bg-muted/50 p-3 sm:p-4 rounded-lg sm:rounded-xl font-medium">{generation.title}</p>
                  </motion.div>

                  {/* Description */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-accent/10 text-accent border-0 text-[10px] sm:text-xs font-medium">
                        Description
                      </Badge>
                      <CopyButton text={generation.description} field="Description" />
                    </div>
                    <p className="text-xs sm:text-sm bg-muted/50 p-3 sm:p-4 rounded-lg sm:rounded-xl leading-relaxed">{generation.description}</p>
                  </motion.div>

                  {/* Tags */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-warning/10 text-warning border-0 text-[10px] sm:text-xs font-medium">
                        Tags ({generation.tags.split(',').length})
                      </Badge>
                      <CopyButton text={generation.tags} field="Tags" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 bg-muted/50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                      {generation.tags.split(',').slice(0, 10).map((tag, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge 
                            variant="outline" 
                            className="text-[10px] sm:text-xs bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors cursor-default py-1 px-2"
                          >
                            {tag.trim()}
                          </Badge>
                        </motion.div>
                      ))}
                      {generation.tags.split(',').length > 10 && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs bg-muted py-1 px-2">
                          +{generation.tags.split(',').length - 10} more
                        </Badge>
                      )}
                    </div>
                  </motion.div>

                  {/* Copy All */}
                  <motion.div variants={itemVariants}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-11 sm:h-12 font-medium text-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all touch-manipulation active:scale-[0.98]"
                        onClick={() => {
                          const allData = `Prompt: ${generation.prompt}\n\nTitle: ${generation.title}\n\nDescription: ${generation.description}\n\nTags: ${generation.tags}`;
                          copyToClipboard(allData, 'All data');
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy All Metadata
                      </Button>
                    </motion.div>
                  </motion.div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Card>
    </motion.div>
  );
}

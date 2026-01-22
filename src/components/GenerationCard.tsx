import { useState } from 'react';
import { Copy, Check, Trash2, ChevronDown, Eye, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Generation } from '@/hooks/useGenerations';
import { toast } from 'sonner';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Lightbox } from '@/components/ui/lightbox';

interface GenerationCardProps {
  generation: Generation;
  onDelete: (id: string) => void;
}

export function GenerationCard({ generation, onDelete }: GenerationCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  const CopyButton = ({ text, field, size = 'default' }: { text: string; field: string; size?: 'default' | 'sm' }) => (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 touch-manipulation active:scale-90",
          size === 'sm' ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9"
        )}
        onClick={(e) => {
          e.stopPropagation();
          copyToClipboard(text, field);
        }}
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
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

  const tagColors = [
    'bg-primary/10 text-primary border-primary/20',
    'bg-secondary/10 text-secondary border-secondary/20',
    'bg-accent/10 text-accent border-accent/20',
    'bg-warning/10 text-warning border-warning/20',
    'bg-success/10 text-success border-success/20',
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        layout
      >
        <Card className="overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="p-0">
            {/* Image Section with Overlay */}
            <div className="relative aspect-video sm:aspect-[16/9] overflow-hidden bg-muted">
              <motion.img
                src={generation.image_url}
                alt={generation.image_name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              {/* Top Actions */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm border-0 text-white"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black/40 hover:bg-destructive/80 backdrop-blur-sm border-0 text-white"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
              
              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <h3 className="font-display font-bold text-sm sm:text-base text-white truncate mb-1 drop-shadow-lg">
                  {generation.image_name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs text-white/80 flex items-center gap-1.5">
                    <motion.span 
                      className="inline-block w-1.5 h-1.5 rounded-full bg-accent"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                    {new Date(generation.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 space-y-3">
            {/* Title Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Badge className="bg-secondary/10 text-secondary border-0 text-[10px] sm:text-xs font-medium shrink-0">
                  Title
                </Badge>
                <CopyButton text={generation.title} field="Title" size="sm" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-relaxed">
                {generation.title}
              </p>
            </div>

            {/* Tags Preview */}
            <div className="flex flex-wrap gap-1">
              {generation.tags.split(',').slice(0, 5).map((tag, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.05, y: -1 }}
                >
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[9px] sm:text-[10px] py-0.5 px-1.5 border cursor-default transition-colors",
                      tagColors[index % tagColors.length]
                    )}
                  >
                    {tag.trim()}
                  </Badge>
                </motion.div>
              ))}
              {generation.tags.split(',').length > 5 && (
                <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0.5 px-1.5 bg-muted border-muted-foreground/20">
                  +{generation.tags.split(',').length - 5}
                </Badge>
              )}
            </div>

            {/* Expand Button */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-9 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 touch-manipulation"
                onClick={() => setExpanded(!expanded)}
              >
                <Eye className="h-3.5 w-3.5" />
                {expanded ? 'Hide Details' : 'View Full Metadata'}
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.div>
              </Button>
            </motion.div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-3 pt-2 border-t border-border/50"
                >
                  {/* Prompt */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px] sm:text-xs font-medium">
                        Prompt
                      </Badge>
                      <CopyButton text={generation.prompt} field="Prompt" size="sm" />
                    </div>
                    <p className="text-xs sm:text-sm bg-muted/50 p-3 rounded-lg leading-relaxed">
                      {generation.prompt}
                    </p>
                  </motion.div>

                  {/* Description */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-accent/10 text-accent border-0 text-[10px] sm:text-xs font-medium">
                        Description
                      </Badge>
                      <CopyButton text={generation.description} field="Description" size="sm" />
                    </div>
                    <p className="text-xs sm:text-sm bg-muted/50 p-3 rounded-lg leading-relaxed max-h-32 overflow-y-auto">
                      {generation.description}
                    </p>
                  </motion.div>

                  {/* All Tags */}
                  <motion.div variants={itemVariants} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-warning/10 text-warning border-0 text-[10px] sm:text-xs font-medium">
                        All Tags ({generation.tags.split(',').length})
                      </Badge>
                      <CopyButton text={generation.tags} field="Tags" size="sm" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 bg-muted/50 p-3 rounded-lg max-h-40 overflow-y-auto">
                      {generation.tags.split(',').map((tag, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.01 }}
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] sm:text-[10px] py-0.5 px-1.5 border cursor-default transition-all",
                              tagColors[index % tagColors.length]
                            )}
                          >
                            {tag.trim()}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Copy All Button */}
                  <motion.div variants={itemVariants}>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full h-10 font-medium text-xs bg-gradient-primary hover:opacity-90 gap-2 touch-manipulation"
                      onClick={() => {
                        const allData = `Prompt: ${generation.prompt}\n\nTitle: ${generation.title}\n\nDescription: ${generation.description}\n\nTags: ${generation.tags}`;
                        copyToClipboard(allData, 'All data');
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy All Metadata
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lightbox */}
      <Lightbox
        media={[{ src: generation.image_url, name: generation.image_name, type: 'image' }]}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={0}
      />
    </>
  );
}

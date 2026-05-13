import { useTranslation } from 'react-i18next';
import { ImagePlus, Sparkles, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  onUploadClick?: () => void;
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Icon */}
      <div className="relative mb-6 sm:mb-8">
        <motion.div 
          className="absolute inset-0 bg-gradient-primary blur-3xl opacity-20 rounded-full scale-150"
          animate={{ 
            scale: [1.5, 1.8, 1.5],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />
        <motion.div 
          className="relative flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 border border-primary/20 shadow-lg"
          animate={{ 
            y: [0, -8, 0],
            rotate: [0, 2, 0, -2, 0]
          }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        >
          <ImagePlus className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
        </motion.div>
        <motion.div 
          className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-primary shadow-lg"
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, 10, 0]
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
        </motion.div>
      </div>
      
      <motion.h3 
        className="font-display font-bold text-xl sm:text-2xl mb-2 sm:mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {t('dashboard.emptyTitle')}
      </motion.h3>
      <motion.p 
        className="text-sm sm:text-base text-muted-foreground max-w-sm mb-6 sm:mb-8 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {t('dashboard.emptyDesc')}
      </motion.p>
      
      {onUploadClick && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={onUploadClick}
            size="lg"
            className="bg-gradient-primary hover:opacity-90 gap-2 px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg font-medium shadow-lg touch-manipulation"
          >
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('dashboard.startGenerating')}
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </motion.div>
      )}

      {/* Decorative elements */}
      <div className="mt-8 sm:mt-12 flex items-center gap-3 sm:gap-4 text-muted-foreground text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <span>{t('features.aiPoweredPrompts')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary/40" />
          <span>{t('features.seoMetadata')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
          <span>50+ {t('dashboard.tagsLabel')}</span>
        </div>
      </div>
    </motion.div>
  );
}

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface UpgradeBannerProps {
  credits: number | null;
}

export function UpgradeBanner({ credits }: UpgradeBannerProps) {
  const { t } = useTranslation();
  const isLowCredits = credits !== null && credits <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl p-4 sm:p-6 ${
        isLowCredits 
          ? 'bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 border border-orange-500/30' 
          : 'bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30'
      }`}
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-2xl" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${isLowCredits ? 'bg-orange-500/20' : 'bg-primary/20'}`}>
            {isLowCredits ? (
              <Zap className="h-6 w-6 text-orange-500" />
            ) : (
              <Crown className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">
              {isLowCredits ? t('dashboard.runningLow') : t('dashboard.upgradeToUnlimited')}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLowCredits 
                ? t('dashboard.lowCreditsDesc', { count: credits })
                : t('dashboard.upgradeDesc')
              }
            </p>
          </div>
        </div>
        
        <Link to="/pricing">
          <Button 
            className="bg-gradient-primary hover:opacity-90 text-white shadow-lg whitespace-nowrap"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isLowCredits ? t('dashboard.getMoreCredits') : t('dashboard.upgradeNow')}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

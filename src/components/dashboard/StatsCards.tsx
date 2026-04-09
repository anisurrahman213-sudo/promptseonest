import { useTranslation } from 'react-i18next';
import { Image, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  totalGenerations: number;
  credits: number | null;
  todayGenerations: number;
}

export function StatsCards({ totalGenerations, credits, todayGenerations }: StatsCardsProps) {
  const { t } = useTranslation();

  const allStats = [
    {
      label: t('dashboard.totalGenerations'),
      shortLabel: t('dashboard.totalGenerations').split(' ')[0],
      value: totalGenerations,
      icon: Image,
      gradient: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20',
    },
    ...(credits !== null ? [{
      label: t('dashboard.creditsRemaining'),
      shortLabel: t('common.credits'),
      value: credits,
      icon: Zap,
      gradient: 'from-warning/20 to-warning/5',
      iconBg: 'bg-warning/15',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20',
    }] : []),
    {
      label: t('dashboard.todayUploads'),
      shortLabel: t('dashboard.todayUploads').split(' ')[0],
      value: todayGenerations,
      icon: TrendingUp,
      gradient: 'from-accent/20 to-accent/5',
      iconBg: 'bg-accent/15',
      iconColor: 'text-accent',
      borderColor: 'border-accent/20',
    },
  ];

  const stats = allStats;

  return (
    <div className={`grid gap-2 sm:gap-4 ${stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {stats.map((stat, index) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.4, type: "spring", stiffness: 300 }}
        >
          <Card className={cn(
            "overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 h-full",
            `bg-gradient-to-br ${stat.gradient}`,
            stat.borderColor
          )}>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <CardContent className="p-3 sm:p-5 h-full relative">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 opacity-10">
                  <Sparkles className="h-16 w-16 sm:h-24 sm:w-24 -mt-4 -mr-4" />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0 h-full relative z-10">
                  <div className="space-y-0.5 sm:space-y-1 text-center sm:text-left order-2 sm:order-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:block">
                      {stat.label}
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider sm:hidden">
                      {stat.shortLabel}
                    </p>
                    <motion.p 
                      className="text-xl sm:text-3xl lg:text-4xl font-bold font-display"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.4, type: "spring" }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <motion.div 
                    className={cn(
                      "p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl order-1 sm:order-2 shadow-sm",
                      stat.iconBg
                    )}
                    whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <stat.icon className={cn("h-4 w-4 sm:h-6 sm:w-6", stat.iconColor)} />
                  </motion.div>
                </div>
              </CardContent>
            </motion.div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

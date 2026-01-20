import { Image, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  totalGenerations: number;
  credits: number | null;
  todayGenerations: number;
}

export function StatsCards({ totalGenerations, credits, todayGenerations }: StatsCardsProps) {
  const stats = [
    {
      label: 'Total Generations',
      shortLabel: 'Total',
      value: totalGenerations,
      icon: Image,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'Credits Available',
      shortLabel: 'Credits',
      value: credits ?? 0,
      icon: Zap,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: 'Generated Today',
      shortLabel: 'Today',
      value: todayGenerations,
      icon: TrendingUp,
      bgColor: 'bg-accent/10',
      iconColor: 'text-accent',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {stats.map((stat, index) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg h-full">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <CardContent className="p-3 sm:p-5 h-full">
                <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0 h-full">
                  <div className="space-y-0.5 sm:space-y-1 text-center sm:text-left order-2 sm:order-1">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:block">
                      {stat.label}
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider sm:hidden">
                      {stat.shortLabel}
                    </p>
                    <motion.p 
                      className="text-xl sm:text-3xl font-bold font-display"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <motion.div 
                    className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl order-1 sm:order-2", stat.bgColor)}
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
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

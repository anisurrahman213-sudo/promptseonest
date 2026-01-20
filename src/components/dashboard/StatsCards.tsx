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
      value: totalGenerations,
      icon: Image,
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Credits Available',
      value: credits ?? 0,
      icon: Zap,
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Generated Today',
      value: todayGenerations,
      icon: TrendingUp,
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <motion.p 
                      className="text-3xl font-bold font-display"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <motion.div 
                    className={cn("p-3 rounded-xl", stat.bgColor)}
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <stat.icon className="h-6 w-6 text-primary" />
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

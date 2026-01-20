import { Image, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
      gradient: 'from-primary to-secondary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Credits Available',
      value: credits ?? 0,
      icon: Zap,
      gradient: 'from-warning to-orange-500',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Generated Today',
      value: todayGenerations,
      icon: TrendingUp,
      gradient: 'from-accent to-teal-400',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.label} 
          className={cn(
            "overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
            "animate-fade-in"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold font-display">
                  {stat.value}
                </p>
              </div>
              <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                <stat.icon className={cn("h-6 w-6 bg-gradient-to-br bg-clip-text", stat.gradient)} 
                  style={{ color: 'hsl(var(--primary))' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

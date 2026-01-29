import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, Image, CheckCircle, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format, differenceInDays, differenceInHours } from 'date-fns';

interface Generation {
  id: string;
  image_name: string;
  title: string;
  created_at: string;
  image_url: string;
  description?: string;
  tags?: string;
}

interface RecentActivityProps {
  generations: Generation[];
  maxItems?: number;
}

export function RecentActivity({ generations, maxItems = 8 }: RecentActivityProps) {
  const { t } = useTranslation();

  const recentItems = useMemo(() => {
    return [...generations]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, maxItems);
  }, [generations, maxItems]);

  // Check if user has been inactive for 3+ days
  const lastActivityDate = useMemo(() => {
    if (generations.length === 0) return null;
    const sorted = [...generations].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return new Date(sorted[0].created_at);
  }, [generations]);

  const daysSinceLastActivity = lastActivityDate 
    ? differenceInDays(new Date(), lastActivityDate) 
    : null;

  const isInactive = daysSinceLastActivity !== null && daysSinceLastActivity >= 3;

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: typeof recentItems } = {};
    
    recentItems.forEach(item => {
      const date = new Date(item.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey: string;
      if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        dateKey = t('dashboard.today');
      } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
        dateKey = t('dashboard.yesterday');
      } else {
        dateKey = format(date, 'MMM d, yyyy');
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    
    return groups;
  }, [recentItems, t]);

  // Calculate time remaining before auto-delete (3 days = 72 hours)
  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const deleteAt = new Date(created);
    deleteAt.setDate(deleteAt.getDate() + 3);
    const hoursRemaining = differenceInHours(deleteAt, new Date());
    
    if (hoursRemaining <= 0) return { text: t('dashboard.expiringSoonLabel'), urgent: true };
    if (hoursRemaining < 24) return { text: `${hoursRemaining}h ${t('dashboard.left')}`, urgent: true };
    const days = Math.floor(hoursRemaining / 24);
    return { text: `${days}d ${hoursRemaining % 24}h ${t('dashboard.left')}`, urgent: days < 1 };
  };

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      {/* Inactivity Warning */}
      {isInactive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                ⚠️ {t('dashboard.inactiveDays', { days: daysSinceLastActivity })}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t('dashboard.inactiveDesc', { days: daysSinceLastActivity })}
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-full blur-2xl" />
        </motion.div>
      )}

      {/* Auto-delete Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20"
      >
        <Clock className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-xs text-destructive">
          <strong>⚠️ {t('dashboard.autoDeleteWarning')}:</strong> {t('dashboard.autoDeleteNotice')}
        </p>
      </motion.div>

      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              {t('dashboard.recentActivity')}
            </div>
            <Badge variant="outline" className="text-xs">
              {generations.length} {t('dashboard.totalLabel')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-0">
          <ScrollArea className="h-auto max-h-[400px]">
            <div className="space-y-6 px-4 sm:px-6">
              {Object.entries(groupedItems).map(([date, items], groupIndex) => (
                <div key={date} className="relative">
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {date}
                      </span>
                      <div className="flex-1 h-px bg-border/50" />
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {items.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Timeline Items */}
                  <div className="relative ml-2 pl-4 border-l-2 border-border/50 space-y-3">
                    {items.map((item, index) => {
                      const timeRemaining = getTimeRemaining(item.created_at);
                      const tagsArray = item.tags?.split(',').slice(0, 3).map(t => t.trim()) || [];
                      
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                          className="relative group"
                        >
                          {/* Timeline Dot */}
                          <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-background border-2 border-primary group-hover:bg-primary transition-colors" />
                          
                          {/* Content Card */}
                          <div className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group-hover:shadow-md border border-transparent hover:border-border/50">
                            <div className="flex gap-3">
                              {/* Thumbnail */}
                              <div className="relative shrink-0">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted ring-2 ring-background">
                                  <img 
                                    src={item.image_url} 
                                    alt={item.image_name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success/20 border-2 border-background flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-success" />
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-medium text-sm truncate flex-1">
                                    {item.title || item.image_name}
                                  </p>
                                  {/* Expiry Badge */}
                                  <Badge 
                                    variant={timeRemaining.urgent ? "destructive" : "outline"} 
                                    className="text-[10px] shrink-0"
                                  >
                                    {timeRemaining.text}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Image className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{item.image_name}</span>
                                </div>
                                
                                {/* Tags */}
                                {tagsArray.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {tagsArray.map((tag, i) => (
                                      <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {item.tags && item.tags.split(',').length > 3 && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                        +{item.tags.split(',').length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {/* Time */}
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {format(new Date(item.created_at), 'h:mm a')} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {generations.length > maxItems && (
            <div className="px-4 sm:px-6 pt-3 mt-3 border-t border-border/50">
              <p className="text-center text-xs text-muted-foreground">
                {t('dashboard.showingOf', { shown: maxItems, total: generations.length })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

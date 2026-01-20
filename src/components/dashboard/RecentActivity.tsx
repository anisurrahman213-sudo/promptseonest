import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Image, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Generation {
  id: string;
  image_name: string;
  title: string;
  created_at: string;
  image_url: string;
}

interface RecentActivityProps {
  generations: Generation[];
  maxItems?: number;
}

export function RecentActivity({ generations, maxItems = 5 }: RecentActivityProps) {
  const recentItems = useMemo(() => {
    return [...generations]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, maxItems);
  }, [generations, maxItems]);

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-auto max-h-[280px]">
            <div className="space-y-3">
              {recentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={item.image_url} 
                        alt={item.image_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success/20 border-2 border-background flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.title || item.image_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Image className="w-3 h-3" />
                      <span className="truncate">{item.image_name}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                    <span className="sm:hidden">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: false })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {generations.length > maxItems && (
            <p className="text-center text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
              Showing {maxItems} of {generations.length} total generations
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

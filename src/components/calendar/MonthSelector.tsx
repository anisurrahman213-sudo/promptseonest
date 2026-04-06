import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarEvent, months } from './calendarData';

interface MonthSelectorProps {
  currentMonth: number;
  onMonthChange: (month: number) => void;
  filteredEvents: CalendarEvent[];
}

export function MonthSelector({ currentMonth, onMonthChange, filteredEvents }: MonthSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center uppercase tracking-wide">
            Select Month
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {months.map((month, idx) => {
              const hasEvents = filteredEvents.some(e => e.month === idx);
              const isActive = currentMonth === idx;
              
              return (
                <motion.button
                  key={idx}
                  onClick={() => onMonthChange(idx)}
                  className={`relative px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : hasEvents
                        ? 'bg-muted/50 hover:bg-muted text-foreground'
                        : 'hover:bg-muted/30 text-muted-foreground'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {month.short}
                  {hasEvents && !isActive && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

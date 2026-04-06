import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarEvent, months, getDaysInMonth, getFirstDayOfMonth } from './calendarData';

interface CalendarGridProps {
  currentMonth: number;
  year: number;
  monthEvents: CalendarEvent[];
  onDateClick: (day: number) => void;
}

export function CalendarGrid({ currentMonth, year, monthEvents, onDateClick }: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(currentMonth, year);
  const firstDay = getFirstDayOfMonth(currentMonth, year);

  const renderDays = () => {
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    weekDays.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="text-center text-xs font-medium text-muted-foreground py-3 uppercase tracking-wide">
          {day}
        </div>
      );
    });
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = monthEvents.filter(e => e.date === day);
      const hasEvent = dayEvents.length > 0;
      const hasCustom = dayEvents.some(e => e.isCustom);
      const firstEvent = dayEvents[0];
      
      days.push(
        <motion.button
          key={`day-${day}`}
          onClick={() => onDateClick(day)}
          className={`aspect-square rounded-xl flex items-center justify-center text-sm sm:text-base relative transition-all ${
            hasEvent 
              ? 'bg-gradient-to-br ' + (firstEvent?.color || 'from-primary to-accent') + ' text-white font-bold shadow-lg cursor-pointer' 
              : 'hover:bg-muted/50 text-foreground font-medium'
          }`}
          whileHover={{ scale: hasEvent ? 1.15 : 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {day}
          {hasEvent && (
            <motion.span 
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full shadow-md ${hasCustom ? 'bg-amber-400' : 'bg-white'}`}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.button>
      );
    }
    
    return days;
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
      <CardContent className="p-4 sm:p-6">
        <motion.h2 
          key={currentMonth}
          className="text-xl sm:text-2xl font-bold text-center mb-6 text-foreground"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {months[currentMonth].name} {year}
        </motion.h2>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentMonth}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-7 gap-1 sm:gap-2"
          >
            {renderDays()}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white border shadow"></span>
            <span>Market Event</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow"></span>
            <span>Custom Event</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarEvent, months } from './calendarData';

interface EventListProps {
  currentMonth: number;
  monthEvents: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}

export function EventList({ currentMonth, monthEvents, onEventClick, onAddEvent }: EventListProps) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Events in {months[currentMonth].name}
        </h2>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentMonth}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 max-h-[400px] overflow-y-auto pr-2"
          >
            {monthEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No events this month</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={onAddEvent}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Event
                </Button>
              </div>
            ) : (
              monthEvents.map((event, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => onEventClick(event)}
                  className="w-full flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/30 transition-all text-left group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 4 }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${event.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <event.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {event.date} {months[event.month].short}
                      </span>
                      {event.isCustom && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {event.title}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {event.description}
                    </p>
                  </div>
                </motion.button>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

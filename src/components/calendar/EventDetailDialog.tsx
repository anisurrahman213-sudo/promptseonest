import { motion } from 'framer-motion';
import { Sparkles, Download, Trash2, Pencil, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CalendarEvent, months } from './calendarData';
import { exportEventToICS } from './calendarUtils';

interface EventDetailDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  year: number;
}

const recurringLabels: Record<string, string> = {
  yearly: 'Repeats every year',
  monthly: 'Repeats every month',
};

export function EventDetailDialog({ event, open, onOpenChange, onDeleteEvent, onEditEvent, year }: EventDetailDialogProps) {
  if (!event) return null;

  const recurringLabel = event.recurring && event.recurring !== 'none' ? recurringLabels[event.recurring] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <motion.div
            className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${event.color} flex items-center justify-center mb-4 shadow-xl`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <event.icon className="h-10 w-10 text-white" />
          </motion.div>
          <DialogTitle className="text-center text-2xl">{event.title}</DialogTitle>
          <DialogDescription className="text-center text-base">
            {event.date} {months[event.month].name}, {year}
            {recurringLabel && (
              <span className="block mt-1 text-xs text-primary inline-flex items-center gap-1 justify-center">
                <Repeat className="h-3 w-3" /> {recurringLabel}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <motion.div
            className="p-4 rounded-xl bg-muted/50 border border-border/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-foreground">{event.description}</p>
          </motion.div>

          <motion.div
            className={`p-5 rounded-xl bg-gradient-to-br ${event.color} text-white shadow-lg`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium opacity-80 mb-2">📈 Content Tip</p>
                <p className="text-base font-medium leading-relaxed">{event.motivation}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex gap-2 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 min-w-[140px]"
              onClick={() => exportEventToICS(event, year)}
            >
              <Download className="h-4 w-4" />
              Add to Calendar
            </Button>
            {event.isCustom && event.id && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => onEditEvent(event)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => onDeleteEvent(event.id!)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

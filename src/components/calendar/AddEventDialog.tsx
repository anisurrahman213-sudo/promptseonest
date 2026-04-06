import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { months } from './calendarData';

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newEventDate: string;
  setNewEventDate: (v: string) => void;
  newEventMonth: string;
  setNewEventMonth: (v: string) => void;
  newEventTitle: string;
  setNewEventTitle: (v: string) => void;
  newEventDescription: string;
  setNewEventDescription: (v: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export function AddEventDialog({
  open, onOpenChange,
  newEventDate, setNewEventDate,
  newEventMonth, setNewEventMonth,
  newEventTitle, setNewEventTitle,
  newEventDescription, setNewEventDescription,
  isLoading, onSubmit,
}: AddEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Custom Stock Event
          </DialogTitle>
          <DialogDescription>
            Create your own stock market event for planning and tracking.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Select value={newEventDate} onValueChange={setNewEventDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={newEventMonth} onValueChange={setNewEventMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{month.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Event Title *</label>
            <Input
              placeholder="e.g., Earnings Report - AAPL"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              placeholder="Brief description of the event..."
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={onSubmit}
              disabled={isLoading || !newEventTitle.trim()}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

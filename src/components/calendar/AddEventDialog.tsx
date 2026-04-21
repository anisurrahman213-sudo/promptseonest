import { Plus, Loader2, Pencil, TrendingUp, Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { months, type EventCategory, type RecurringMode } from './calendarData';

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
  newEventCategory: EventCategory;
  setNewEventCategory: (v: EventCategory) => void;
  newEventRecurring: RecurringMode;
  setNewEventRecurring: (v: RecurringMode) => void;
  isLoading: boolean;
  isEditMode: boolean;
  onSubmit: () => void;
}

export function AddEventDialog({
  open, onOpenChange,
  newEventDate, setNewEventDate,
  newEventMonth, setNewEventMonth,
  newEventTitle, setNewEventTitle,
  newEventDescription, setNewEventDescription,
  newEventCategory, setNewEventCategory,
  newEventRecurring, setNewEventRecurring,
  isLoading, isEditMode, onSubmit,
}: AddEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {isEditMode ? 'Edit Custom Event' : 'Add Custom Event'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your event details, category, or repeat schedule.'
              : 'Create your own event for planning, reminders & recurring tracking.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <ToggleGroup
              type="single"
              value={newEventCategory}
              onValueChange={(v) => v && setNewEventCategory(v as EventCategory)}
              className="grid grid-cols-3 gap-2"
            >
              <ToggleGroupItem value="stock" className="data-[state=on]:bg-emerald-500 data-[state=on]:text-white gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Stock
              </ToggleGroupItem>
              <ToggleGroupItem value="photography" className="data-[state=on]:bg-purple-500 data-[state=on]:text-white gap-1.5">
                <Camera className="h-3.5 w-3.5" /> Photo
              </ToggleGroupItem>
              <ToggleGroupItem value="personal" className="data-[state=on]:bg-amber-500 data-[state=on]:text-white gap-1.5">
                <User className="h-3.5 w-3.5" /> Personal
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Date + Month */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Select value={newEventDate} onValueChange={setNewEventDate}>
                <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{month.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label className="text-sm font-medium mb-2 block">Repeat</label>
            <Select value={newEventRecurring} onValueChange={(v) => setNewEventRecurring(v as RecurringMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="yearly">Every year (e.g. birthday, anniversary)</SelectItem>
                <SelectItem value="monthly">Every month (e.g. monthly review)</SelectItem>
              </SelectContent>
            </Select>
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
              {isEditMode ? 'Save Changes' : 'Add Event'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

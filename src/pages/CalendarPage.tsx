import { useState, useEffect, useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Star, TrendingUp, Plus, Filter, Download, Camera, Search, CalendarCheck, User } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  CalendarEvent,
  CustomEventDB,
  stockMarketEvents,
  type EventCategory,
  type RecurringMode,
} from '@/components/calendar/calendarData';
import { photographyEvents } from '@/components/calendar/photographyEvents';
import { exportMonthToICS } from '@/components/calendar/calendarUtils';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { EventList } from '@/components/calendar/EventList';
import { EventDetailDialog } from '@/components/calendar/EventDetailDialog';
import { AddEventDialog } from '@/components/calendar/AddEventDialog';
import { MonthSelector } from '@/components/calendar/MonthSelector';

const YEAR_OPTIONS = [2025, 2026, 2027, 2028];

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear() >= 2025 ? today.getFullYear() : 2026);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
const [activeFilters, setActiveFilters] = useState<string[]>(['stock', 'photography', 'holiday', 'custom']);
  const [categoryFilters, setCategoryFilters] = useState<string[]>(['stock', 'photography', 'personal']);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryMatchMode, setCategoryMatchMode] = useState<'any' | 'all'>('any');

  // Add/Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEventDate, setNewEventDate] = useState('1');
  const [newEventMonth, setNewEventMonth] = useState('0');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<EventCategory>('stock');
  const [newEventRecurring, setNewEventRecurring] = useState<RecurringMode>('none');

  useEffect(() => {
    if (user) fetchCustomEvents();
  }, [user]);

  const fetchCustomEvents = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('custom_events')
      .select('*')
      .eq('user_id', user.id);

    if (error) { console.error('Error fetching custom events:', error); return; }

    const events: CalendarEvent[] = (data as CustomEventDB[]).map((event) => {
      const cat = (event.category as EventCategory) || 'stock';
      const color =
        cat === 'photography' ? 'from-purple-500 to-pink-500'
          : cat === 'personal' ? 'from-amber-500 to-orange-500'
            : 'from-emerald-500 to-teal-500';
      const icon = cat === 'photography' ? Camera : cat === 'personal' ? Star : TrendingUp;
      return {
        date: event.date,
        month: event.month,
        title: event.title,
        description: event.description || '',
        motivation: 'Your custom event — stay on top of your plan!',
        icon,
        color,
        type: 'stock' as const,
        isCustom: true,
        id: event.id,
        category: cat,
        recurring: (event.recurring as RecurringMode) || 'none',
      };
    });
    setCustomEvents(events);
  };

  const resetForm = () => {
    setEditingId(null);
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventCategory('stock');
    setNewEventRecurring('none');
  };

  const handleAddEvent = async () => {
    if (!user || !newEventTitle.trim()) { toast.error('Please enter an event title'); return; }
    setIsLoading(true);

    const payload = {
      user_id: user.id,
      date: parseInt(newEventDate),
      month: parseInt(newEventMonth),
      title: newEventTitle.trim(),
      description: newEventDescription.trim() || null,
      event_type: 'stock',
      category: newEventCategory,
      recurring: newEventRecurring,
    };

    const { error } = editingId
      ? await supabase.from('custom_events').update(payload).eq('id', editingId).eq('user_id', user.id)
      : await supabase.from('custom_events').insert(payload);

    if (error) {
      toast.error(editingId ? 'Failed to update event' : 'Failed to add event');
      console.error(error);
    } else {
      toast.success(editingId ? 'Event updated!' : 'Custom event added!');
      resetForm();
      setIsAddDialogOpen(false);
      fetchCustomEvents();
    }
    setIsLoading(false);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    if (!event.id) return;
    setEditingId(event.id);
    setNewEventDate(event.date.toString());
    setNewEventMonth(event.month.toString());
    setNewEventTitle(event.title);
    setNewEventDescription(event.description);
    setNewEventCategory(event.category || 'stock');
    setNewEventRecurring(event.recurring || 'none');
    setIsDialogOpen(false);
    setIsAddDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.from('custom_events').delete().eq('id', eventId).eq('user_id', user.id);
    if (error) { toast.error('Failed to delete event'); console.error(error); }
    else { toast.success('Event deleted'); fetchCustomEvents(); setIsDialogOpen(false); }
  };

  const jumpToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    toast.success('Jumped to today');
  };

  const allEvents = useMemo(
    () => [...stockMarketEvents, ...photographyEvents, ...customEvents],
    [customEvents]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

const filteredEvents = allEvents.filter((event) => {
    // Event type filter (Stock/Holiday/Photography/Custom)
    if (event.isCustom) {
      if (!activeFilters.includes('custom')) return false;
      // For custom events, also apply category filter
      if (!categoryFilters.includes(event.category || 'stock')) return false;
    } else if (event.type === 'stock') {
      if (!activeFilters.includes('stock')) return false;
      if (!categoryFilters.includes('stock')) return false;
    } else if (['holiday', 'celebration', 'motivation'].includes(event.type)) {
      if (!activeFilters.includes('holiday')) return false;
    } else if (event.type === 'creative') {
      if (!activeFilters.includes('photography')) return false;
      if (!categoryFilters.includes('photography')) return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!event.title.toLowerCase().includes(q) && !event.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

const monthEvents = filteredEvents.filter((e) => e.month === currentMonth);

  // Category counts for current month + search query (independent of category filter selection)
  const categoryCounts = useMemo(() => {
    const counts = { stock: 0, photography: 0, personal: 0 };
    allEvents.forEach((event) => {
      if (event.month !== currentMonth) return;

      // Apply search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!event.title.toLowerCase().includes(q) && !event.description.toLowerCase().includes(q)) {
          return;
        }
      }

      // Apply event type filter
      if (event.isCustom) {
        if (!activeFilters.includes('custom')) return;
      } else if (event.type === 'stock') {
        if (!activeFilters.includes('stock')) return;
      } else if (['holiday', 'celebration', 'motivation'].includes(event.type)) {
        if (!activeFilters.includes('holiday')) return;
      } else if (event.type === 'creative') {
        if (!activeFilters.includes('photography')) return;
      }

      // Count by category
      if (event.isCustom) {
        const cat = event.category || 'stock';
        if (cat === 'stock') counts.stock++;
        else if (cat === 'photography') counts.photography++;
        else if (cat === 'personal') counts.personal++;
      } else if (event.type === 'stock') {
        counts.stock++;
      } else if (event.type === 'creative') {
        counts.photography++;
      }
    });
    return counts;
  }, [allEvents, currentMonth, searchQuery, activeFilters]);

  const handleDateClick = (day: number) => {
    const event = monthEvents.find((e) => e.date === day);
    if (event) { setSelectedEvent(event); setIsDialogOpen(true); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Content Calendar" description="Plan your stock photography content with our AI-powered calendar. Never miss trending topics and seasonal opportunities." path="/calendar" keywords="content calendar, stock photo planning, seasonal photography" />
      <Header />

      <main className="container py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div className="text-center mb-8 sm:mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <TrendingUp className="h-4 w-4" />
              📈 Stock Market & Photography Calendar
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Worldwide <span className="text-gradient">Stock Events</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Track global market holidays, seasonal photography trends & plan your content strategy.
            </p>
          </motion.div>

          {/* Year + Today + Search */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          >
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={jumpToToday} size="sm" variant="outline" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              Today
            </Button>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </motion.div>

          {/* Event Type Filters */}
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <ToggleGroup type="multiple" value={activeFilters} onValueChange={(value) => { if (value.length > 0) setActiveFilters(value); }} className="bg-muted/30 rounded-lg p-1 flex-wrap">
                <ToggleGroupItem value="stock" aria-label="Toggle Stock Events" className="data-[state=on]:bg-emerald-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /><span className="hidden sm:inline">Stock</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="photography" aria-label="Toggle Photography Events" className="data-[state=on]:bg-purple-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5">
                  <Camera className="h-3.5 w-3.5" /><span className="hidden sm:inline">Photo</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="holiday" aria-label="Toggle Holiday Events" className="data-[state=on]:bg-pink-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5">
                  <Star className="h-3.5 w-3.5" /><span className="hidden sm:inline">Holiday</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="custom" aria-label="Toggle Custom Events" className="data-[state=on]:bg-amber-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /><span className="hidden sm:inline">Custom</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { resetForm(); setNewEventMonth(currentMonth.toString()); setIsAddDialogOpen(true); }} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Event</span>
              </Button>
              <Button onClick={() => exportMonthToICS(monthEvents, currentMonth, year)} size="sm" variant="outline" className="gap-2">
                <Download className="h-4 w-4" /><span className="hidden sm:inline">Export Month</span>
              </Button>
            </div>
          </motion.div>

          {/* Category Filters (Stock/Photography/Personal) */}
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Category:</span>
              <ToggleGroup type="multiple" value={categoryFilters} onValueChange={(value) => { if (value.length > 0) setCategoryFilters(value); }} className="bg-muted/30 rounded-lg p-1 flex-wrap">
                <ToggleGroupItem value="stock" aria-label="Toggle Stock Category" className="data-[state=on]:bg-emerald-500/80 data-[state=on]:text-white px-2.5 py-1 text-xs gap-1.5 border border-transparent data-[state=on]:border-emerald-400/50">
                  <TrendingUp className="h-3 w-3" />
                  <span>Stock</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-600/40 text-[10px] font-bold min-w-[18px] text-center">
                    {categoryCounts.stock}
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem value="photography" aria-label="Toggle Photography Category" className="data-[state=on]:bg-purple-500/80 data-[state=on]:text-white px-2.5 py-1 text-xs gap-1.5 border border-transparent data-[state=on]:border-purple-400/50">
                  <Camera className="h-3 w-3" />
                  <span>Photography</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-600/40 text-[10px] font-bold min-w-[18px] text-center">
                    {categoryCounts.photography}
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem value="personal" aria-label="Toggle Personal Category" className="data-[state=on]:bg-amber-500/80 data-[state=on]:text-white px-2.5 py-1 text-xs gap-1.5 border border-transparent data-[state=on]:border-amber-400/50">
                  <User className="h-3 w-3" />
                  <span>Personal</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-600/40 text-[10px] font-bold min-w-[18px] text-center">
                    {categoryCounts.personal}
                  </span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {(searchQuery.trim() || categoryFilters.length < 3) && (
              <div className="text-xs text-muted-foreground">
                Showing {monthEvents.filter(e => e.month === currentMonth).length} events
                {searchQuery.trim() && <span> for "{searchQuery}"</span>}
              </div>
            )}
          </motion.div>

          {/* Main Content */}
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CalendarGrid currentMonth={currentMonth} year={year} monthEvents={monthEvents} onDateClick={handleDateClick} />
            <EventList currentMonth={currentMonth} monthEvents={monthEvents} onEventClick={(event) => { setSelectedEvent(event); setIsDialogOpen(true); }} onAddEvent={() => { resetForm(); setNewEventMonth(currentMonth.toString()); setIsAddDialogOpen(true); }} />
          </motion.div>

          <MonthSelector currentMonth={currentMonth} onMonthChange={setCurrentMonth} filteredEvents={filteredEvents} />
        </div>
      </main>

      <EventDetailDialog
        event={selectedEvent}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onDeleteEvent={handleDeleteEvent}
        onEditEvent={handleEditEvent}
        year={year}
      />
      <AddEventDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}
        newEventDate={newEventDate} setNewEventDate={setNewEventDate}
        newEventMonth={newEventMonth} setNewEventMonth={setNewEventMonth}
        newEventTitle={newEventTitle} setNewEventTitle={setNewEventTitle}
        newEventDescription={newEventDescription} setNewEventDescription={setNewEventDescription}
        newEventCategory={newEventCategory} setNewEventCategory={setNewEventCategory}
        newEventRecurring={newEventRecurring} setNewEventRecurring={setNewEventRecurring}
        isLoading={isLoading}
        isEditMode={!!editingId}
        onSubmit={handleAddEvent}
      />
    </div>
  );
}

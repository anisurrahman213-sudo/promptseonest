import { useState, useEffect } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Star, TrendingUp, Plus, Filter, Download } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarEvent, CustomEventDB, stockMarketEvents } from '@/components/calendar/calendarData';
import { exportMonthToICS } from '@/components/calendar/calendarUtils';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { EventList } from '@/components/calendar/EventList';
import { EventDetailDialog } from '@/components/calendar/EventDetailDialog';
import { AddEventDialog } from '@/components/calendar/AddEventDialog';
import { MonthSelector } from '@/components/calendar/MonthSelector';

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(['stock', 'holiday', 'custom']);
  
  const [newEventDate, setNewEventDate] = useState('1');
  const [newEventMonth, setNewEventMonth] = useState('0');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  
  const year = 2026;

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
    
    const events: CalendarEvent[] = (data as CustomEventDB[]).map(event => ({
      date: event.date, month: event.month, title: event.title,
      description: event.description || '',
      motivation: "Your custom stock market event - Stay focused on your goals!",
      icon: TrendingUp, color: "from-primary to-accent",
      type: 'stock' as const, isCustom: true, id: event.id,
    }));
    setCustomEvents(events);
  };

  const handleAddEvent = async () => {
    if (!user || !newEventTitle.trim()) { toast.error('Please enter an event title'); return; }
    setIsLoading(true);
    const { error } = await supabase.from('custom_events').insert({
      user_id: user.id, date: parseInt(newEventDate), month: parseInt(newEventMonth),
      title: newEventTitle.trim(), description: newEventDescription.trim() || null, event_type: 'stock',
    });
    if (error) { toast.error('Failed to add event'); console.error(error); }
    else { toast.success('Custom event added!'); setNewEventTitle(''); setNewEventDescription(''); setIsAddDialogOpen(false); fetchCustomEvents(); }
    setIsLoading(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.from('custom_events').delete().eq('id', eventId).eq('user_id', user.id);
    if (error) { toast.error('Failed to delete event'); console.error(error); }
    else { toast.success('Event deleted'); fetchCustomEvents(); setIsDialogOpen(false); }
  };

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

  const allEvents = [...stockMarketEvents, ...customEvents];
  const filteredEvents = allEvents.filter(event => {
    if (event.isCustom && activeFilters.includes('custom')) return true;
    if (event.type === 'stock' && !event.isCustom && activeFilters.includes('stock')) return true;
    if (['holiday', 'celebration', 'creative', 'motivation'].includes(event.type) && activeFilters.includes('holiday')) return true;
    return false;
  });
  const monthEvents = filteredEvents.filter(e => e.month === currentMonth);

  const handleDateClick = (day: number) => {
    const event = monthEvents.find(e => e.date === day);
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
              📈 Stock Market Calendar 2026
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Worldwide <span className="text-gradient">Stock Events</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Track global market holidays, trading events & plan your stock content strategy. Add your own custom events!
            </p>
          </motion.div>

          {/* Filter & Controls */}
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <ToggleGroup type="multiple" value={activeFilters} onValueChange={(value) => { if (value.length > 0) setActiveFilters(value); }} className="bg-muted/30 rounded-lg p-1">
                <ToggleGroupItem value="stock" aria-label="Toggle Stock Events" className="data-[state=on]:bg-emerald-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /><span className="hidden sm:inline">Stock</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="holiday" aria-label="Toggle Holiday Events" className="data-[state=on]:bg-purple-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5">
                  <Star className="h-3.5 w-3.5" /><span className="hidden sm:inline">Holiday</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="custom" aria-label="Toggle Custom Events" className="data-[state=on]:bg-amber-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /><span className="hidden sm:inline">Custom</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setNewEventMonth(currentMonth.toString()); setIsAddDialogOpen(true); }} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Event</span>
              </Button>
              <Button onClick={() => exportMonthToICS(monthEvents, currentMonth)} size="sm" variant="outline" className="gap-2">
                <Download className="h-4 w-4" /><span className="hidden sm:inline">Export Month</span>
              </Button>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CalendarGrid currentMonth={currentMonth} year={year} monthEvents={monthEvents} onDateClick={handleDateClick} />
            <EventList currentMonth={currentMonth} monthEvents={monthEvents} onEventClick={(event) => { setSelectedEvent(event); setIsDialogOpen(true); }} onAddEvent={() => { setNewEventMonth(currentMonth.toString()); setIsAddDialogOpen(true); }} />
          </motion.div>

          <MonthSelector currentMonth={currentMonth} onMonthChange={setCurrentMonth} filteredEvents={filteredEvents} />
        </div>
      </main>

      <EventDetailDialog event={selectedEvent} open={isDialogOpen} onOpenChange={setIsDialogOpen} onDeleteEvent={handleDeleteEvent} year={year} />
      <AddEventDialog
        open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}
        newEventDate={newEventDate} setNewEventDate={setNewEventDate}
        newEventMonth={newEventMonth} setNewEventMonth={setNewEventMonth}
        newEventTitle={newEventTitle} setNewEventTitle={setNewEventTitle}
        newEventDescription={newEventDescription} setNewEventDescription={setNewEventDescription}
        isLoading={isLoading} onSubmit={handleAddEvent}
      />
    </div>
  );
}

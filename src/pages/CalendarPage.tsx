import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, Star, Heart, Rocket, Trophy, Gift, Sun, Moon, Flame, Target, TrendingUp, DollarSign, BarChart3, Globe, Building2, Briefcase, Plus, X, Trash2, Filter, Download } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CalendarEvent {
  date: number;
  month: number;
  title: string;
  description: string;
  motivation: string;
  icon: React.ElementType;
  color: string;
  type: 'holiday' | 'celebration' | 'creative' | 'motivation' | 'stock';
  isCustom?: boolean;
  id?: string;
}

interface CustomEventDB {
  id: string;
  user_id: string;
  date: number;
  month: number;
  title: string;
  description: string | null;
  event_type: string;
  created_at: string;
}

// Worldwide Stock Market Events for 2026
const stockMarketEvents: CalendarEvent[] = [
  // January
  { date: 1, month: 0, title: "New Year's Day 📈", description: "Global markets closed - Plan your Q1 stock photography strategy", motivation: "New year, new opportunities! Start creating trending financial content.", icon: TrendingUp, color: "from-emerald-500 to-green-600", type: 'stock' },
  { date: 2, month: 0, title: "Markets Reopen 🔔", description: "NYSE, NASDAQ reopen - Capture fresh trading floor moments", motivation: "First trading day energy! Stock images of busy traders sell well.", icon: BarChart3, color: "from-blue-500 to-cyan-500", type: 'stock' },
  { date: 20, month: 0, title: "Martin Luther King Jr. Day (US)", description: "US markets closed - Focus on diversity in finance content", motivation: "Create inclusive business imagery showcasing diverse professionals.", icon: Globe, color: "from-violet-500 to-purple-500", type: 'stock' },
  { date: 26, month: 0, title: "Australia Day 🇦🇺", description: "ASX closed - Focus on Asia-Pacific market content", motivation: "Australian financial imagery is in demand globally!", icon: Building2, color: "from-blue-600 to-blue-400", type: 'stock' },
  
  // February
  { date: 12, month: 1, title: "Chinese New Year 🐍", description: "Year of the Snake - Asian markets affected", motivation: "Snake year symbolizes wisdom & wealth. Create prosperity-themed content!", icon: DollarSign, color: "from-red-500 to-yellow-500", type: 'stock' },
  { date: 16, month: 1, title: "Presidents' Day (US)", description: "US markets closed - Create patriotic business content", motivation: "American dream imagery always performs well!", icon: Briefcase, color: "from-blue-600 to-red-500", type: 'stock' },
  
  // March
  { date: 14, month: 2, title: "Pi Day 🥧", description: "Tech & finance crossover - Create fintech content", motivation: "Mathematical precision in finance content is trending!", icon: Target, color: "from-cyan-500 to-blue-500", type: 'stock' },
  { date: 20, month: 2, title: "Spring Equinox 🌱", description: "New beginnings - Q1 earnings season approaches", motivation: "Fresh start imagery for financial planning content!", icon: Sun, color: "from-green-500 to-emerald-500", type: 'stock' },
  
  // April
  { date: 3, month: 3, title: "Good Friday 🌿", description: "Most global markets closed - Religious financial planning content", motivation: "Create content about values-based investing!", icon: Heart, color: "from-purple-500 to-pink-500", type: 'stock' },
  { date: 15, month: 3, title: "Tax Day (US) 💼", description: "US Tax deadline - High demand for tax/finance imagery", motivation: "Tax season content peaks today! Accounting visuals are hot!", icon: DollarSign, color: "from-green-600 to-teal-500", type: 'stock' },
  { date: 22, month: 3, title: "Earth Day 🌍", description: "ESG investing focus - Sustainable finance content", motivation: "Green investing imagery is booming! Create eco-finance content.", icon: Globe, color: "from-green-500 to-emerald-600", type: 'stock' },
  
  // May
  { date: 5, month: 4, title: "Cinco de Mayo 🇲🇽", description: "Latin American markets focus - LATAM financial content", motivation: "Latin American business imagery is underrepresented - opportunity!", icon: Sparkles, color: "from-red-500 to-green-500", type: 'stock' },
  { date: 25, month: 4, title: "Memorial Day (US)", description: "US markets closed - Summer investing content begins", motivation: "Create 'summer portfolio' themed imagery!", icon: Sun, color: "from-blue-500 to-red-500", type: 'stock' },
  
  // June
  { date: 19, month: 5, title: "Juneteenth (US)", description: "US markets closed - Diversity in finance content", motivation: "Black excellence in finance is highly searchable content!", icon: Trophy, color: "from-purple-600 to-amber-500", type: 'stock' },
  { date: 21, month: 5, title: "Summer Solstice ☀️", description: "Mid-year review - Financial planning imagery demand peaks", motivation: "Half-year financial review content is trending now!", icon: BarChart3, color: "from-yellow-500 to-orange-500", type: 'stock' },
  
  // July
  { date: 3, month: 6, title: "US Markets Early Close", description: "Early close before July 4th - American business imagery", motivation: "Independence and financial freedom themes work great!", icon: Rocket, color: "from-blue-600 to-red-500", type: 'stock' },
  { date: 4, month: 6, title: "Independence Day (US) 🇺🇸", description: "US markets closed - American dream financial content", motivation: "Stars & stripes meet stocks! Patriotic investing imagery sells!", icon: Star, color: "from-red-500 to-blue-600", type: 'stock' },
  
  // August
  { date: 3, month: 7, title: "Summer Bank Holiday (UK) 🇬🇧", description: "LSE closed - Focus on European financial content", motivation: "European summer banking content is in demand!", icon: Building2, color: "from-blue-500 to-red-500", type: 'stock' },
  { date: 15, month: 7, title: "India Independence Day 🇮🇳", description: "NSE/BSE closed - Indian market content opportunity", motivation: "Emerging market content from India is highly valuable!", icon: Globe, color: "from-orange-500 to-green-500", type: 'stock' },
  
  // September
  { date: 7, month: 8, title: "Labor Day (US)", description: "US markets closed - Back to business season begins", motivation: "Post-summer investing content demand spikes!", icon: Briefcase, color: "from-blue-600 to-indigo-600", type: 'stock' },
  { date: 22, month: 8, title: "Autumn Equinox 🍂", description: "Q3 ending - Quarterly report imagery in demand", motivation: "Fall financial planning content peaks now!", icon: Target, color: "from-orange-500 to-amber-600", type: 'stock' },
  
  // October
  { date: 1, month: 9, title: "China National Day 🇨🇳", description: "Chinese markets closed (Golden Week) - Asia focus", motivation: "Chinese business content is always in demand!", icon: Building2, color: "from-red-600 to-yellow-500", type: 'stock' },
  { date: 12, month: 9, title: "Columbus Day / Indigenous Day", description: "Bond markets closed - Diversity & exploration themes", motivation: "Discovery and new frontiers in finance!", icon: Rocket, color: "from-teal-500 to-blue-500", type: 'stock' },
  { date: 29, month: 9, title: "Diwali 🪔", description: "Festival of Lights - Indian markets celebration", motivation: "Prosperity and wealth imagery for Diwali is golden!", icon: Sparkles, color: "from-amber-500 to-orange-500", type: 'stock' },
  
  // November
  { date: 11, month: 10, title: "Veterans Day (US)", description: "Bond markets closed - NYSE open", motivation: "Honor and service in business content resonates!", icon: Trophy, color: "from-blue-600 to-red-600", type: 'stock' },
  { date: 26, month: 10, title: "Thanksgiving (US) 🦃", description: "US markets closed - Gratitude in business content", motivation: "Grateful business themes sell well this season!", icon: Heart, color: "from-orange-500 to-amber-600", type: 'stock' },
  { date: 27, month: 10, title: "Black Friday 🛒", description: "Early close - Retail & e-commerce stock imagery peak", motivation: "Shopping and retail investing content peaks today!", icon: DollarSign, color: "from-gray-800 to-amber-500", type: 'stock' },
  
  // December
  { date: 24, month: 11, title: "Christmas Eve 🎄", description: "Global markets early close - Holiday investing content", motivation: "Year-end financial planning imagery in high demand!", icon: Gift, color: "from-green-600 to-red-500", type: 'stock' },
  { date: 25, month: 11, title: "Christmas Day 🎅", description: "Most global markets closed - Create 2027 planning content", motivation: "Prepare next year's financial content now!", icon: Star, color: "from-red-500 to-green-600", type: 'stock' },
  { date: 26, month: 11, title: "Boxing Day 🇬🇧🇦🇺🇨🇦", description: "UK, Canada, Australia markets closed - Sales imagery", motivation: "Post-holiday sales and retail investing content!", icon: Gift, color: "from-blue-500 to-purple-500", type: 'stock' },
  { date: 31, month: 11, title: "New Year's Eve 🥂", description: "Early close - Year in review content", motivation: "Annual review and 2027 prediction content is HOT!", icon: TrendingUp, color: "from-amber-500 to-yellow-400", type: 'stock' },
];

const months = [
  { name: 'January', short: 'Jan' },
  { name: 'February', short: 'Feb' },
  { name: 'March', short: 'Mar' },
  { name: 'April', short: 'Apr' },
  { name: 'May', short: 'May' },
  { name: 'June', short: 'Jun' },
  { name: 'July', short: 'Jul' },
  { name: 'August', short: 'Aug' },
  { name: 'September', short: 'Sep' },
  { name: 'October', short: 'Oct' },
  { name: 'November', short: 'Nov' },
  { name: 'December', short: 'Dec' },
];

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month: number, year: number) => {
  return new Date(year, month, 1).getDay();
};

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(['stock', 'holiday', 'custom']);
  
  // Form state
  const [newEventDate, setNewEventDate] = useState('1');
  const [newEventMonth, setNewEventMonth] = useState('0');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  
  const year = 2026;

  // Fetch custom events
  useEffect(() => {
    if (user) {
      fetchCustomEvents();
    }
  }, [user]);

  const fetchCustomEvents = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('custom_events')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching custom events:', error);
      return;
    }
    
    const events: CalendarEvent[] = (data as CustomEventDB[]).map(event => ({
      date: event.date,
      month: event.month,
      title: event.title,
      description: event.description || '',
      motivation: "Your custom stock market event - Stay focused on your goals!",
      icon: TrendingUp,
      color: "from-primary to-accent",
      type: 'stock' as const,
      isCustom: true,
      id: event.id,
    }));
    
    setCustomEvents(events);
  };

  const handleAddEvent = async () => {
    if (!user || !newEventTitle.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await supabase
      .from('custom_events')
      .insert({
        user_id: user.id,
        date: parseInt(newEventDate),
        month: parseInt(newEventMonth),
        title: newEventTitle.trim(),
        description: newEventDescription.trim() || null,
        event_type: 'stock',
      });
    
    if (error) {
      toast.error('Failed to add event');
      console.error(error);
    } else {
      toast.success('Custom event added!');
      setNewEventTitle('');
      setNewEventDescription('');
      setIsAddDialogOpen(false);
      fetchCustomEvents();
    }
    
    setIsLoading(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('custom_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);
    
    if (error) {
      toast.error('Failed to delete event');
      console.error(error);
    } else {
      toast.success('Event deleted');
      fetchCustomEvents();
      setIsDialogOpen(false);
    }
  };

  // Generate ICS file content for a single event
  const generateICSContent = (event: CalendarEvent): string => {
    const year = 2026;
    const month = String(event.month + 1).padStart(2, '0');
    const day = String(event.date).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Create end date (next day for all-day event)
    const endDate = new Date(year, event.month, event.date + 1);
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endYear = endDate.getFullYear();
    const endDateStr = `${endYear}${endMonth}${endDay}`;
    
    const uid = `${dateStr}-${event.title.replace(/[^a-zA-Z0-9]/g, '')}-stockcalendar@app`;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Stock Market Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${endDateStr}
SUMMARY:${event.title}
DESCRIPTION:${event.description}\\n\\n${event.motivation}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
  };

  // Export single event to ICS
  const exportEventToICS = (event: CalendarEvent) => {
    const icsContent = generateICSContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_2026.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Event exported to calendar!');
  };

  // Export all filtered events for current month
  const exportMonthToICS = () => {
    if (monthEvents.length === 0) {
      toast.error('No events to export this month');
      return;
    }

    const year = 2026;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let eventsICS = '';
    monthEvents.forEach(event => {
      const month = String(event.month + 1).padStart(2, '0');
      const day = String(event.date).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      const endDate = new Date(year, event.month, event.date + 1);
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(endDate.getDate()).padStart(2, '0');
      const endYear = endDate.getFullYear();
      const endDateStr = `${endYear}${endMonth}${endDay}`;
      
      const uid = `${dateStr}-${event.title.replace(/[^a-zA-Z0-9]/g, '')}-stockcalendar@app`;
      
      eventsICS += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${endDateStr}
SUMMARY:${event.title}
DESCRIPTION:${event.description}\\n\\n${event.motivation}
STATUS:CONFIRMED
END:VEVENT
`;
    });

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Stock Market Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${eventsICS}END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Stock_Events_${months[currentMonth].name}_2026.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${monthEvents.length} events exported!`);
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Combine stock market events and custom events
  const allEvents = [...stockMarketEvents, ...customEvents];

  // Filter events based on active filters
  const filteredEvents = allEvents.filter(event => {
    if (event.isCustom && activeFilters.includes('custom')) return true;
    if (event.type === 'stock' && !event.isCustom && activeFilters.includes('stock')) return true;
    if (['holiday', 'celebration', 'creative', 'motivation'].includes(event.type) && activeFilters.includes('holiday')) return true;
    return false;
  });

  const daysInMonth = getDaysInMonth(currentMonth, year);
  const firstDay = getFirstDayOfMonth(currentMonth, year);
  const monthEvents = filteredEvents.filter(e => e.month === currentMonth);

  const handleDateClick = (day: number) => {
    const event = monthEvents.find(e => e.date === day);
    if (event) {
      setSelectedEvent(event);
      setIsDialogOpen(true);
    }
  };

  const renderCalendarDays = () => {
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
          onClick={() => handleDateClick(day)}
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
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

          {/* Filter & Add Event Controls */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Category Filters */}
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <ToggleGroup 
                type="multiple" 
                value={activeFilters}
                onValueChange={(value) => {
                  if (value.length > 0) setActiveFilters(value);
                }}
                className="bg-muted/30 rounded-lg p-1"
              >
                <ToggleGroupItem 
                  value="stock" 
                  aria-label="Toggle Stock Events"
                  className="data-[state=on]:bg-emerald-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Stock</span>
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="holiday" 
                  aria-label="Toggle Holiday Events"
                  className="data-[state=on]:bg-purple-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Holiday</span>
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="custom" 
                  aria-label="Toggle Custom Events"
                  className="data-[state=on]:bg-amber-500 data-[state=on]:text-white px-3 py-1.5 text-xs sm:text-sm gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Custom</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setNewEventMonth(currentMonth.toString());
                  setIsAddDialogOpen(true);
                }}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Event</span>
              </Button>
              <Button
                onClick={exportMonthToICS}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export Month</span>
              </Button>
            </div>
          </motion.div>

          {/* Main Content - Side by Side */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Calendar Card */}
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
                    {renderCalendarDays()}
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

            {/* Events List Card */}
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            setNewEventMonth(currentMonth.toString());
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Event
                        </Button>
                      </div>
                    ) : (
                      monthEvents.map((event, idx) => (
                        <motion.button
                          key={idx}
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsDialogOpen(true);
                          }}
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
          </motion.div>

          {/* Month Selector */}
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
                        onClick={() => setCurrentMonth(idx)}
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
        </div>
      </main>

      {/* Event Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <motion.div 
                  className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedEvent.color} flex items-center justify-center mb-4 shadow-xl`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <selectedEvent.icon className="h-10 w-10 text-white" />
                </motion.div>
                <DialogTitle className="text-center text-2xl">
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription className="text-center text-base">
                  {selectedEvent.date} {months[selectedEvent.month].name}, {year}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <motion.div 
                  className="p-4 rounded-xl bg-muted/50 border border-border/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-foreground">{selectedEvent.description}</p>
                </motion.div>
                
                <motion.div 
                  className={`p-5 rounded-xl bg-gradient-to-br ${selectedEvent.color} text-white shadow-lg`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-6 w-6 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium opacity-80 mb-2">📈 Stock Content Tip</p>
                      <p className="text-base font-medium leading-relaxed">{selectedEvent.motivation}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => exportEventToICS(selectedEvent)}
                  >
                    <Download className="h-4 w-4" />
                    Add to Calendar
                  </Button>
                  {selectedEvent.isCustom && selectedEvent.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDeleteEvent(selectedEvent.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleAddEvent}
                disabled={isLoading || !newEventTitle.trim()}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

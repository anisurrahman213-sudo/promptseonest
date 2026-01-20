import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Sparkles, Star, Heart, Rocket, Trophy, Gift, Sun, Moon, Flame, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CalendarEvent {
  date: number;
  month: number;
  title: string;
  description: string;
  motivation: string;
  icon: React.ElementType;
  color: string;
  type: 'holiday' | 'celebration' | 'creative' | 'motivation';
}

const events2026: CalendarEvent[] = [
  // January
  { date: 1, month: 0, title: "New Year's Day 🎉", description: "Welcome 2026 with new dreams and aspirations", motivation: "Every sunrise is an invitation to brighten someone's day. Start fresh, dream big!", icon: Sparkles, color: "from-violet-500 to-purple-600", type: 'celebration' },
  { date: 15, month: 0, title: "Goal Setting Day 🎯", description: "Set your creative goals for the year", motivation: "A goal without a plan is just a wish. Make your dreams actionable!", icon: Target, color: "from-blue-500 to-cyan-500", type: 'motivation' },
  
  // February
  { date: 14, month: 1, title: "Valentine's Day 💕", description: "Celebrate love and creativity", motivation: "Love is the greatest creative force in the universe. Share it freely!", icon: Heart, color: "from-pink-500 to-rose-500", type: 'celebration' },
  { date: 21, month: 1, title: "International Mother Language Day", description: "Celebrate linguistic and cultural diversity", motivation: "Your voice is unique. Use it to create, inspire, and connect!", icon: Star, color: "from-amber-500 to-orange-500", type: 'holiday' },
  
  // March
  { date: 8, month: 2, title: "International Women's Day 💪", description: "Celebrate women's achievements worldwide", motivation: "Empowered women empower the world. Create without limits!", icon: Flame, color: "from-purple-500 to-pink-500", type: 'celebration' },
  { date: 21, month: 2, title: "World Poetry Day 📝", description: "Express yourself through creative writing", motivation: "Poetry is the rhythmical creation of beauty in words. Create yours!", icon: Sparkles, color: "from-indigo-500 to-purple-500", type: 'creative' },
  
  // April
  { date: 7, month: 3, title: "World Health Day 🏃", description: "Focus on wellness and creativity", motivation: "A healthy mind breeds creative ideas. Take care of yourself!", icon: Sun, color: "from-green-500 to-emerald-500", type: 'holiday' },
  { date: 22, month: 3, title: "Earth Day 🌍", description: "Celebrate our beautiful planet", motivation: "The Earth provides enough for everyone's need. Create sustainably!", icon: Heart, color: "from-green-600 to-teal-500", type: 'celebration' },
  
  // May
  { date: 1, month: 4, title: "May Day 🌸", description: "Celebrate workers and creators worldwide", motivation: "Every creator is a worker of dreams. Your effort matters!", icon: Trophy, color: "from-red-500 to-orange-500", type: 'holiday' },
  { date: 21, month: 4, title: "World Day for Cultural Diversity", description: "Embrace diverse creative expressions", motivation: "Diversity is the art of thinking independently together!", icon: Sparkles, color: "from-cyan-500 to-blue-500", type: 'creative' },
  
  // June
  { date: 5, month: 5, title: "World Environment Day 🌿", description: "Create content that inspires eco-consciousness", motivation: "Nature is the greatest artist. Learn from her masterpieces!", icon: Sun, color: "from-emerald-500 to-green-600", type: 'holiday' },
  { date: 21, month: 5, title: "Summer Solstice ☀️", description: "Longest day of the year - maximize creativity!", motivation: "Let your creativity shine as bright as the summer sun!", icon: Flame, color: "from-yellow-500 to-orange-500", type: 'celebration' },
  
  // July
  { date: 4, month: 6, title: "Independence Day (US) 🎆", description: "Celebrate freedom and creative expression", motivation: "Freedom is the oxygen of creativity. Breathe it in!", icon: Rocket, color: "from-blue-600 to-red-500", type: 'celebration' },
  { date: 17, month: 6, title: "World Emoji Day 😊", description: "Express emotions through visual creativity", motivation: "A picture is worth a thousand words. An emoji? Priceless!", icon: Star, color: "from-yellow-400 to-amber-500", type: 'creative' },
  
  // August
  { date: 12, month: 7, title: "International Youth Day 🌟", description: "Celebrate young creators and innovators", motivation: "Youth is not a time of life, it's a state of creative mind!", icon: Rocket, color: "from-violet-500 to-purple-500", type: 'celebration' },
  { date: 19, month: 7, title: "World Photography Day 📸", description: "Capture moments, create memories", motivation: "Every photograph is a story waiting to be told. Tell yours!", icon: Sparkles, color: "from-slate-600 to-zinc-700", type: 'creative' },
  
  // September
  { date: 8, month: 8, title: "International Literacy Day 📚", description: "Celebrate the power of words", motivation: "Reading is dreaming with open eyes. Writing is dreaming with open hands!", icon: Star, color: "from-blue-500 to-indigo-500", type: 'holiday' },
  { date: 21, month: 8, title: "International Day of Peace ☮️", description: "Create content that promotes harmony", motivation: "Peace begins with a creative smile. Share positivity!", icon: Heart, color: "from-sky-400 to-blue-500", type: 'celebration' },
  
  // October
  { date: 5, month: 9, title: "World Teachers' Day 👨‍🏫", description: "Honor those who inspire creativity", motivation: "A teacher affects eternity through creative minds they shape!", icon: Trophy, color: "from-amber-500 to-yellow-500", type: 'holiday' },
  { date: 31, month: 9, title: "Halloween 🎃", description: "Unleash your creative imagination", motivation: "On Halloween, creativity wears its most colorful costumes!", icon: Moon, color: "from-orange-500 to-purple-600", type: 'celebration' },
  
  // November
  { date: 13, month: 10, title: "World Kindness Day 💝", description: "Create content that spreads joy", motivation: "Kindness is a language which the deaf can hear and the blind can see!", icon: Heart, color: "from-pink-400 to-rose-500", type: 'motivation' },
  { date: 26, month: 10, title: "Thanksgiving 🦃", description: "Be grateful for creative opportunities", motivation: "Gratitude turns what we have into enough. Create with thankfulness!", icon: Gift, color: "from-orange-500 to-amber-600", type: 'celebration' },
  
  // December
  { date: 10, month: 11, title: "Human Rights Day ✊", description: "Create content that empowers", motivation: "Everyone has the right to create, to dream, to inspire!", icon: Flame, color: "from-blue-600 to-purple-600", type: 'holiday' },
  { date: 25, month: 11, title: "Christmas Day 🎄", description: "Season of joy and creative giving", motivation: "The best gift you can give is something you created with love!", icon: Gift, color: "from-red-500 to-green-500", type: 'celebration' },
  { date: 31, month: 11, title: "New Year's Eve 🥂", description: "Reflect on creative achievements", motivation: "End the year with gratitude, start the new one with creative fire!", icon: Sparkles, color: "from-gold-400 to-yellow-500", type: 'celebration' },
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month: number, year: number) => {
  return new Date(year, month, 1).getDay();
};

export function EventCalendar() {
  const [currentMonth, setCurrentMonth] = useState(0); // January
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const year = 2026;

  const daysInMonth = getDaysInMonth(currentMonth, year);
  const firstDay = getFirstDayOfMonth(currentMonth, year);
  
  const monthEvents = events2026.filter(e => e.month === currentMonth);
  
  const handlePrevMonth = () => {
    setCurrentMonth(prev => (prev === 0 ? 11 : prev - 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(prev => (prev === 11 ? 0 : prev + 1));
  };

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
    
    // Week headers
    weekDays.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="text-center text-xs font-medium text-muted-foreground py-2">
          {day}
        </div>
      );
    });
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const event = monthEvents.find(e => e.date === day);
      const hasEvent = !!event;
      
      days.push(
        <motion.button
          key={`day-${day}`}
          onClick={() => handleDateClick(day)}
          className={`aspect-square rounded-lg flex items-center justify-center text-sm relative transition-all ${
            hasEvent 
              ? 'bg-gradient-to-br ' + (event?.color || 'from-primary to-accent') + ' text-white font-semibold shadow-lg cursor-pointer hover:scale-110' 
              : 'hover:bg-muted/50 text-foreground'
          }`}
          whileHover={hasEvent ? { scale: 1.1 } : { scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {day}
          {hasEvent && (
            <motion.span 
              className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </motion.button>
      );
    }
    
    return days;
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div 
          className="mx-auto mb-12 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <Calendar className="h-4 w-4" />
            📅 Event Calendar 2026
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Discover & Explore 2026
          </h2>
          <p className="text-lg text-muted-foreground">
            Explore important events, holidays, and celebrations throughout 2026. 
            Click on any highlighted date to see events and get inspired!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.h3 
                  key={currentMonth}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-bold text-foreground"
                >
                  {months[currentMonth]} {year}
                </motion.h3>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>

              {/* Calendar Grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMonth}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-7 gap-1"
                >
                  {renderCalendarDays()}
                </motion.div>
              </AnimatePresence>

              {/* Monthly Events Preview */}
              <div className="mt-6 pt-4 border-t border-border/50">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Events this month ({monthEvents.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {monthEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No special events this month</p>
                  ) : (
                    monthEvents.map((event, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsDialogOpen(true);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        whileHover={{ x: 4 }}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${event.color} flex items-center justify-center`}>
                          <event.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.date} {months[event.month]}</p>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Event Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <motion.div 
                    className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedEvent.color} flex items-center justify-center mb-4`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <selectedEvent.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <DialogTitle className="text-center text-xl">
                    {selectedEvent.title}
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    {selectedEvent.date} {months[selectedEvent.month]}, {year}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <motion.div 
                    className="p-4 rounded-xl bg-muted/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-sm text-foreground">{selectedEvent.description}</p>
                  </motion.div>
                  
                  <motion.div 
                    className={`p-4 rounded-xl bg-gradient-to-br ${selectedEvent.color} text-white`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium opacity-80 mb-1">✨ Motivation of the Day</p>
                        <p className="text-sm font-medium leading-relaxed">{selectedEvent.motivation}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

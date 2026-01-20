import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, Star, Heart, Rocket, Trophy, Gift, Sun, Moon, Flame, Target } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
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
  { date: 21, month: 1, title: "International Mother Language Day 🇧🇩", description: "Celebrate linguistic and cultural diversity - Ekushey February", motivation: "Your mother language is your identity. Preserve it, celebrate it!", icon: Star, color: "from-green-600 to-red-500", type: 'holiday' },
  
  // March
  { date: 8, month: 2, title: "International Women's Day 💪", description: "Celebrate women's achievements worldwide", motivation: "Empowered women empower the world. Create without limits!", icon: Flame, color: "from-purple-500 to-pink-500", type: 'celebration' },
  { date: 17, month: 2, title: "Sheikh Mujibur Rahman's Birthday 🇧🇩", description: "National Children's Day - Bangabandhu's birthday", motivation: "The father of the nation dreamed big. Continue his legacy!", icon: Star, color: "from-green-600 to-green-400", type: 'holiday' },
  { date: 26, month: 2, title: "Independence Day 🇧🇩", description: "Bangladesh Independence Day - Shadhinota Dibosh", motivation: "Freedom was earned through sacrifice. Honor it with creativity!", icon: Flame, color: "from-green-600 to-red-500", type: 'holiday' },
  
  // April
  { date: 14, month: 3, title: "Pohela Boishakh 🎊", description: "Bengali New Year - Celebrate with joy", motivation: "A new year brings new hope. Embrace Bengali culture with pride!", icon: Sun, color: "from-red-500 to-orange-500", type: 'celebration' },
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
  { date: 15, month: 7, title: "National Mourning Day 🇧🇩", description: "Remembering Bangabandhu Sheikh Mujibur Rahman", motivation: "A great leader lives on through the nation he built.", icon: Star, color: "from-slate-600 to-slate-700", type: 'holiday' },
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
  { date: 16, month: 11, title: "Victory Day 🇧🇩", description: "Bijoy Dibosh - Celebrating Bangladesh's victory", motivation: "Victory belongs to those who believe in it the most!", icon: Trophy, color: "from-green-600 to-red-500", type: 'holiday' },
  { date: 25, month: 11, title: "Christmas Day 🎄", description: "Season of joy and creative giving", motivation: "The best gift you can give is something you created with love!", icon: Gift, color: "from-red-500 to-green-500", type: 'celebration' },
  { date: 31, month: 11, title: "New Year's Eve 🥂", description: "Reflect on creative achievements", motivation: "End the year with gratitude, start the new one with creative fire!", icon: Sparkles, color: "from-amber-400 to-yellow-500", type: 'celebration' },
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
  const year = 2026;

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

  const daysInMonth = getDaysInMonth(currentMonth, year);
  const firstDay = getFirstDayOfMonth(currentMonth, year);
  const monthEvents = events2026.filter(e => e.month === currentMonth);

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
      const event = monthEvents.find(e => e.date === day);
      const hasEvent = !!event;
      
      days.push(
        <motion.button
          key={`day-${day}`}
          onClick={() => handleDateClick(day)}
          className={`aspect-square rounded-xl flex items-center justify-center text-sm sm:text-base relative transition-all ${
            hasEvent 
              ? 'bg-gradient-to-br ' + (event?.color || 'from-primary to-accent') + ' text-white font-bold shadow-lg cursor-pointer' 
              : 'hover:bg-muted/50 text-foreground font-medium'
          }`}
          whileHover={{ scale: hasEvent ? 1.15 : 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {day}
          {hasEvent && (
            <motion.span 
              className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-md"
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
              <Calendar className="h-4 w-4" />
              📅 Event Calendar 2026
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Discover & Explore <span className="text-gradient">2026</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Explore important events, holidays, and celebrations. Click on any highlighted date to see events and get inspired!
            </p>
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
              </CardContent>
            </Card>

            {/* Events List Card */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
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
                        <p className="text-muted-foreground">No special events this month</p>
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
                          transition={{ delay: idx * 0.1 }}
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
                    const hasEvents = events2026.some(e => e.month === idx);
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
                      <p className="text-sm font-medium opacity-80 mb-2">✨ Motivation of the Day</p>
                      <p className="text-base font-medium leading-relaxed">{selectedEvent.motivation}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

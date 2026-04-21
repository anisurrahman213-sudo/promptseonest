import { Sparkles, Star, Heart, Rocket, Trophy, Gift, Sun, Moon, Flame, Target, TrendingUp, DollarSign, BarChart3, Globe, Building2, Briefcase } from 'lucide-react';

export type EventCategory = 'stock' | 'photography' | 'personal';
export type RecurringMode = 'none' | 'yearly' | 'monthly';

export interface CalendarEvent {
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
  category?: EventCategory;
  recurring?: RecurringMode;
}

export interface CustomEventDB {
  id: string;
  user_id: string;
  date: number;
  month: number;
  title: string;
  description: string | null;
  event_type: string;
  category?: string;
  recurring?: string;
  created_at: string;
}

export const months = [
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

export const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (month: number, year: number) => {
  return new Date(year, month, 1).getDay();
};

// Worldwide Stock Market Events (year-agnostic — recur yearly)
export const stockMarketEvents: CalendarEvent[] = [
  // January
  { date: 1, month: 0, title: "New Year's Day 📈", description: "Global markets closed - Plan your Q1 stock photography strategy", motivation: "New year, new opportunities! Start creating trending financial content.", icon: TrendingUp, color: "from-emerald-500 to-green-600", type: 'stock' },
  { date: 2, month: 0, title: "Markets Reopen 🔔", description: "NYSE, NASDAQ reopen - Capture fresh trading floor moments", motivation: "First trading day energy! Stock images of busy traders sell well.", icon: BarChart3, color: "from-blue-500 to-cyan-500", type: 'stock' },
  { date: 20, month: 0, title: "Martin Luther King Jr. Day (US)", description: "US markets closed - Focus on diversity in finance content", motivation: "Create inclusive business imagery showcasing diverse professionals.", icon: Globe, color: "from-violet-500 to-purple-500", type: 'stock' },
  { date: 26, month: 0, title: "Australia Day 🇦🇺", description: "ASX closed - Focus on Asia-Pacific market content", motivation: "Australian financial imagery is in demand globally!", icon: Building2, color: "from-blue-600 to-blue-400", type: 'stock' },
  // February
  { date: 12, month: 1, title: "Chinese New Year 🐍", description: "Asian markets affected - prosperity content peaks", motivation: "Lunar New Year symbolizes wisdom & wealth. Create prosperity-themed content!", icon: DollarSign, color: "from-red-500 to-yellow-500", type: 'stock' },
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
  { date: 25, month: 11, title: "Christmas Day 🎅", description: "Most global markets closed - Create next year's planning content", motivation: "Prepare next year's financial content now!", icon: Star, color: "from-red-500 to-green-600", type: 'stock' },
  { date: 26, month: 11, title: "Boxing Day 🇬🇧🇦🇺🇨🇦", description: "UK, Canada, Australia markets closed - Sales imagery", motivation: "Post-holiday sales and retail investing content!", icon: Gift, color: "from-blue-500 to-purple-500", type: 'stock' },
  { date: 31, month: 11, title: "New Year's Eve 🥂", description: "Early close - Year in review content", motivation: "Annual review and next-year prediction content is HOT!", icon: TrendingUp, color: "from-amber-500 to-yellow-400", type: 'stock' },
];

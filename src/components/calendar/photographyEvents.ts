import { Camera, Heart, Snowflake, Flower2, Sun, Leaf, Ghost, Gift, Coffee, Plane, ShoppingBag, Cake } from 'lucide-react';
import type { CalendarEvent } from './calendarData';

// Photography & Stock Contributor seasonal trending themes for 2026
export const photographyEvents: CalendarEvent[] = [
  // January
  { date: 1, month: 0, title: "New Year Resolutions 📸", description: "Fitness, planner, goal-setting imagery peaks", motivation: "Shoot lifestyle: gym, journals, healthy meals — January is gold for wellness stock!", icon: Coffee, color: "from-cyan-500 to-blue-500", type: 'creative' },
  { date: 15, month: 0, title: "Winter Wonderland Theme ❄️", description: "Snow scenes, cozy interiors, hot drinks", motivation: "Submit winter content NOW — buyers plan Q1 campaigns this week!", icon: Snowflake, color: "from-blue-300 to-indigo-500", type: 'creative' },

  // February
  { date: 1, month: 1, title: "Valentine's Prep Window 💝", description: "Couples, romance, gifts — start submitting today", motivation: "Buyers search for Valentine content from Feb 1-10. Submit early to rank!", icon: Heart, color: "from-pink-500 to-rose-500", type: 'creative' },
  { date: 14, month: 1, title: "Valentine's Day 💕", description: "Peak demand for romance, flowers, dining imagery", motivation: "Couples stock peaks today — but plan Mother's Day shoots NOW for May.", icon: Heart, color: "from-rose-500 to-pink-600", type: 'creative' },

  // March
  { date: 8, month: 2, title: "International Women's Day 👩", description: "Empowered women, leadership, diversity imagery", motivation: "Women in business/tech is one of the highest-selling categories all year!", icon: Camera, color: "from-purple-500 to-pink-500", type: 'creative' },
  { date: 20, month: 2, title: "Spring Theme Window 🌸", description: "Flowers, fresh starts, pastel colors trending", motivation: "Spring lifestyle content sells through May — start uploading!", icon: Flower2, color: "from-pink-400 to-rose-400", type: 'creative' },

  // April
  { date: 1, month: 3, title: "Easter Prep Window 🐰", description: "Eggs, pastels, family gatherings — submit by April 5", motivation: "Easter content has only 2 weeks of buying window. Submit early!", icon: Gift, color: "from-yellow-400 to-pink-400", type: 'creative' },
  { date: 22, month: 3, title: "Earth Day Photography 🌍", description: "Sustainability, nature, eco-friendly lifestyle", motivation: "Green/ESG imagery demand is rising 40% YoY — huge opportunity!", icon: Leaf, color: "from-green-500 to-emerald-600", type: 'creative' },

  // May
  { date: 1, month: 4, title: "Mother's Day Window 💐", description: "Mothers, families, gifts — peak buying period", motivation: "Submit family/parenting content TODAY for Mother's Day campaigns.", icon: Heart, color: "from-pink-500 to-rose-500", type: 'creative' },
  { date: 20, month: 4, title: "Summer Travel Prep ✈️", description: "Beaches, suitcases, destinations trending", motivation: "Travel content peaks May-July. Submit destination shots now!", icon: Plane, color: "from-sky-500 to-blue-500", type: 'creative' },

  // June
  { date: 1, month: 5, title: "Pride Month 🌈", description: "Diversity, inclusion, LGBTQ+ celebration imagery", motivation: "Inclusive imagery is in record demand — major brands buy heavily.", icon: Camera, color: "from-pink-500 via-purple-500 to-blue-500", type: 'creative' },
  { date: 21, month: 5, title: "Summer Solstice ☀️", description: "Beach, outdoor, vacation lifestyle peak", motivation: "Summer lifestyle content is the #1 selling theme of the year!", icon: Sun, color: "from-yellow-400 to-orange-500", type: 'creative' },

  // July
  { date: 15, month: 6, title: "Back-to-School Window 🎒", description: "Start submitting school, study, education content", motivation: "B2S buying starts in July — submit 6 weeks before peak demand!", icon: Camera, color: "from-amber-500 to-orange-500", type: 'creative' },

  // August
  { date: 1, month: 7, title: "Fall Fashion Prep 🍁", description: "Sweaters, boots, layered looks trending", motivation: "Fashion brands buy fall content in August. Submit cozy lifestyle now!", icon: Leaf, color: "from-orange-500 to-amber-600", type: 'creative' },
  { date: 25, month: 7, title: "Halloween Prep Window 🎃", description: "Costumes, pumpkins, spooky themes — submit by Sep 5", motivation: "Halloween has 6 weeks of buying. Submit early to capture market share!", icon: Ghost, color: "from-orange-600 to-purple-600", type: 'creative' },

  // September
  { date: 22, month: 8, title: "Autumn Aesthetic 🍂", description: "Pumpkin spice, sweaters, golden hour shoots", motivation: "Cozy fall content sells through November — peak season!", icon: Leaf, color: "from-amber-600 to-orange-700", type: 'creative' },

  // October
  { date: 1, month: 9, title: "Holiday Prep Window 🎁", description: "Christmas, Hanukkah, winter holidays — start submitting", motivation: "Submit holiday content NOW — buyers plan Q4 campaigns this week!", icon: Gift, color: "from-red-500 to-green-600", type: 'creative' },
  { date: 31, month: 9, title: "Halloween 👻", description: "Peak demand window closing — Black Friday content next", motivation: "Pivot to Black Friday/Cyber Monday content TOMORROW!", icon: Ghost, color: "from-orange-600 to-black", type: 'creative' },

  // November
  { date: 15, month: 10, title: "Black Friday Content Peak 🛍️", description: "Shopping, deals, retail imagery in highest demand", motivation: "Retail/e-commerce content is the top earner in November!", icon: ShoppingBag, color: "from-gray-900 to-amber-500", type: 'creative' },

  // December
  { date: 1, month: 11, title: "New Year Content Prep 🎊", description: "Submit 2027 planning, goals, fitness imagery NOW", motivation: "January content must be live by mid-December to rank in time!", icon: Camera, color: "from-purple-600 to-pink-600", type: 'creative' },
  { date: 25, month: 11, title: "Christmas Day 🎄", description: "Family, gifts, celebration peak demand", motivation: "Today's content sells next year — shoot family moments!", icon: Cake, color: "from-red-600 to-green-600", type: 'creative' },
];

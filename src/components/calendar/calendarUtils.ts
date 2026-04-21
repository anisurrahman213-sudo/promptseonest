import { CalendarEvent, months } from './calendarData';
import { toast } from 'sonner';

const fmtDate = (year: number, month: number, day: number) => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}${m}${d}`;
};

const buildVEvent = (event: CalendarEvent, year: number, timestamp: string): string => {
  const dateStr = fmtDate(year, event.month, event.date);
  const endDate = new Date(year, event.month, event.date + 1);
  const endDateStr = fmtDate(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const uid = `${dateStr}-${event.title.replace(/[^a-zA-Z0-9]/g, '')}-stockcalendar@app`;
  const rrule = event.recurring === 'yearly'
    ? '\nRRULE:FREQ=YEARLY'
    : event.recurring === 'monthly'
      ? '\nRRULE:FREQ=MONTHLY'
      : '';

  return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${endDateStr}
SUMMARY:${event.title}
DESCRIPTION:${event.description}\\n\\n${event.motivation}${rrule}
STATUS:CONFIRMED
END:VEVENT`;
};

export const exportEventToICS = (event: CalendarEvent, year: number = new Date().getFullYear()) => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Stock Market Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${buildVEvent(event, year, timestamp)}
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_${year}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('Event exported to calendar!');
};

export const exportMonthToICS = (monthEvents: CalendarEvent[], currentMonth: number, year: number = new Date().getFullYear()) => {
  if (monthEvents.length === 0) {
    toast.error('No events to export this month');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const eventsICS = monthEvents.map(event => buildVEvent(event, year, timestamp)).join('\n');

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Stock Market Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${eventsICS}
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Stock_Events_${months[currentMonth].name}_${year}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`${monthEvents.length} events exported!`);
};

/** Today helper: returns true if a calendar slot matches today */
export const isToday = (date: number, month: number, year: number): boolean => {
  const now = new Date();
  return now.getDate() === date && now.getMonth() === month && now.getFullYear() === year;
};

/** Find upcoming events within `days` days from now */
export const getUpcomingEvents = (events: CalendarEvent[], days: number, year: number): CalendarEvent[] => {
  const now = new Date();
  const horizon = new Date();
  horizon.setDate(now.getDate() + days);

  return events.filter(e => {
    const eventDate = new Date(year, e.month, e.date);
    return eventDate >= now && eventDate <= horizon;
  }).sort((a, b) => {
    const da = new Date(year, a.month, a.date).getTime();
    const db = new Date(year, b.month, b.date).getTime();
    return da - db;
  });
};

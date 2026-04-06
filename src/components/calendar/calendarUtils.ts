import { CalendarEvent, months } from './calendarData';
import { toast } from 'sonner';

export const generateICSContent = (event: CalendarEvent): string => {
  const year = 2026;
  const month = String(event.month + 1).padStart(2, '0');
  const day = String(event.date).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
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

export const exportEventToICS = (event: CalendarEvent) => {
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

export const exportMonthToICS = (monthEvents: CalendarEvent[], currentMonth: number) => {
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

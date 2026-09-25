export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  duration?: number; // in minutes, defaults to 2 hours
}

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const start = event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = (event.endDate || new Date(event.startDate.getTime() + (event.duration || 120) * 60000))
    .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Apple Calendar (.ics file) data
 */
export const generateAppleCalendarData = (event: CalendarEvent): string => {
  const start = event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = (event.endDate || new Date(event.startDate.getTime() + (event.duration || 120) * 60000))
    .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const description = (event.description || '').replace(/\n/g, '\\n');
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Elektr-Âme//Event//EN',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${event.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

/**
 * Download .ics file for Apple Calendar / Outlook
 */
export const downloadCalendarFile = (event: CalendarEvent): void => {
  const icsContent = generateAppleCalendarData(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate Outlook Calendar URL
 */
export const generateOutlookCalendarUrl = (event: CalendarEvent): string => {
  const start = event.startDate.toISOString();
  const end = (event.endDate || new Date(event.startDate.getTime() + (event.duration || 120) * 60000))
    .toISOString();
  
  const params = new URLSearchParams({
    subject: event.title,
    startdt: start,
    enddt: end,
    body: event.description || '',
    location: event.location || '',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};


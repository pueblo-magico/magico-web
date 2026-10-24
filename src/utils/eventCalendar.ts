export type CalendarEventCard = {
  showInMainEvents?: boolean;
  startDate?: string;
  endDate?: string;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EVENT_TIME_ZONE = 'America/Argentina/Cordoba';

export const getEventCalendarDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
};

export const shouldShowUpcomingEvent = (
  card: CalendarEventCard,
  today = getEventCalendarDateKey(),
) => {
  const finalDate = card.endDate || card.startDate;
  if (!finalDate || !DATE_KEY_PATTERN.test(finalDate)) return true;

  return finalDate >= today;
};

export const shouldShowMainCalendarEvent = (
  card: CalendarEventCard,
  today = getEventCalendarDateKey(),
) => card.showInMainEvents !== false && shouldShowUpcomingEvent(card, today);


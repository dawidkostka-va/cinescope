const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Parses a strict `YYYY-MM-DD` string into a local-midnight Date, or null if invalid. */
export function parseIsoDate(value: string | null): Date | null {
  if (!value || !ISO_DATE_RE.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function weekdayName(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
}

export function monthAbbrev(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
}

/** `<Weekday> <D> <Mon> <HH:mm>`, e.g. "Tuesday 15 Sep 16:00". */
export function formatShowDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return '';
  return `${weekdayName(date)} ${date.getDate()} ${monthAbbrev(date)} ${time}`;
}

/** Resolves the day selected via the `date` query param: missing, invalid or past selects today. */
export function resolveSelectedDate(dateParam: string | null): Date {
  const today = startOfToday();
  const parsed = parseIsoDate(dateParam);
  if (!parsed || toIsoDate(parsed) < toIsoDate(today)) {
    return today;
  }
  return parsed;
}

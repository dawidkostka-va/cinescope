const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats a date as an ISO date (YYYY-MM-DD) using the browser's local calendar. */
export function toIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses a YYYY-MM-DD string into a local midnight Date; returns null for anything that is not a real calendar date. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (toIsoDate(date) !== value) {
    return null;
  }
  return date;
}

/** Local midnight of the given date. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Returns the date `days` days after `date`. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** English full weekday name, e.g. "Tuesday". */
export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

/** Show date as `<Weekday> <D> <Mon> <HH:mm>`, e.g. "Tuesday 15 Sep 16:00". */
export function formatShowDate(date: Date, time: string): string {
  return `${weekdayName(date)} ${date.getDate()} ${MONTHS[date.getMonth()]} ${time}`;
}

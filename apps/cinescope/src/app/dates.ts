const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Formats a local calendar date as YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses a strict YYYY-MM-DD string into a local date, or returns null if it is not a real date. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = value?.match(ISO_DATE);
  if (!match) {
    return null;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

/** Local midnight of the current day. */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** English weekday name in full, e.g. "Tuesday". */
export function weekdayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/** Show date as `<Weekday> <D> <Mon> <HH:mm>`, e.g. "Tuesday 15 Sep 16:00". */
export function formatShowDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) {
    return `${isoDate} ${time}`;
  }
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekdayName(date)} ${date.getDate()} ${month} ${time}`;
}

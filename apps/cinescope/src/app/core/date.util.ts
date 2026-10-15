const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function today(): Date {
  return startOfDay(new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Parses a strict `YYYY-MM-DD` string, returning null for anything else, including invalid calendar dates. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isBeforeToday(date: Date): boolean {
  return startOfDay(date).getTime() < today().getTime();
}

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

/** Formats as `<Weekday> <D> <Mon> <HH:mm>`, e.g. `Tuesday 15 Sep 16:00`. */
export function formatShowDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return `${isoDate} ${time}`;
  return `${weekdayName(date)} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${time}`;
}

/** Resolves a raw `date` query param to a selected day: missing, invalid or past dates fall back to today. */
export function resolveSelectedDate(raw: string | null): Date {
  if (!raw) return today();
  const parsed = parseIsoDate(raw);
  if (!parsed || isBeforeToday(parsed)) return today();
  return parsed;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

/** Parses a strict `YYYY-MM-DD` string into a local-midnight Date, or null if invalid. */
export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

export function isPastIsoDate(value: string, todayIso: string = todayIsoDate()): boolean {
  return value < todayIso;
}

/** Resolves a raw `date` query param to the iso date that should be selected. */
export function resolveSelectedIsoDate(raw: string | null): string {
  const today = todayIsoDate();
  if (!raw || !isValidIsoDate(raw) || isPastIsoDate(raw, today)) {
    return today;
  }
  return raw;
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) throw new Error(`Invalid iso date: ${iso}`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function weekdayName(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) throw new Error(`Invalid iso date: ${iso}`);
  return WEEKDAYS[date.getDay()];
}

/** Formats `<Weekday> <D> <Mon> <HH:mm>`, e.g. `Tuesday 15 Sep 16:00`. */
export function formatShowDate(iso: string, time: string): string {
  const date = parseIsoDate(iso);
  if (!date) throw new Error(`Invalid iso date: ${iso}`);
  const weekday = WEEKDAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];
  return `${weekday} ${date.getDate()} ${month} ${time}`;
}

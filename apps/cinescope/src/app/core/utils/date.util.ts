const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoToday(): string {
  return formatIso(new Date());
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseIso(value: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function weekdayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function monthShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

/** `<Weekday> <D> <Mon> <HH:mm>`, e.g. "Tuesday 15 Sep 16:00". */
export function formatShowDate(isoDate: string, time: string): string {
  const date = parseIso(isoDate);
  if (!date) return '';
  return `${weekdayName(date)} ${date.getDate()} ${monthShort(date)} ${time}`;
}

/** Resolves the day shown on the movie list: missing, invalid or past dates fall back to today. */
export function resolveSelectedDate(raw: string | null, todayIso: string): string {
  if (!raw) return todayIso;
  if (!parseIso(raw)) return todayIso;
  if (raw < todayIso) return todayIso;
  return raw;
}

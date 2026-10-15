export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const date = parseIsoDate(value);
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === value;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function weekdayFull(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function monthShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

export function formatShowDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  return `${weekdayFull(date)} ${date.getDate()} ${monthShort(date)} ${time}`;
}

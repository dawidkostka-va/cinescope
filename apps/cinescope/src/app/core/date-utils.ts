export function formatIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isValidIso(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = parseIso(value);
  return !isNaN(date.getTime()) && formatIso(date) === value;
}

export function todayIso(): string {
  return formatIso(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return formatIso(date);
}

export function weekdayFull(iso: string): string {
  return parseIso(iso).toLocaleDateString('en-US', { weekday: 'long' });
}

export function monthShort(iso: string): string {
  return parseIso(iso).toLocaleDateString('en-US', { month: 'short' });
}

export function dayOfMonth(iso: string): number {
  return parseIso(iso).getDate();
}

export function showDate(iso: string, time: string): string {
  return `${weekdayFull(iso)} ${dayOfMonth(iso)} ${monthShort(iso)} ${time}`;
}

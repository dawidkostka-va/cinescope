const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

export function parseIso(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function isPastIso(iso: string): boolean {
  const date = parseIso(iso);
  if (!date) return true;
  const today = parseIso(todayIso());
  if (!today) return true;
  return date.getTime() < today.getTime();
}

export function normalizeSelectedDate(raw: string | null): string {
  if (!raw) return todayIso();
  if (!parseIso(raw)) return todayIso();
  if (isPastIso(raw)) return todayIso();
  return raw;
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso) ?? new Date();
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function weekdayName(iso: string): string {
  const date = parseIso(iso);
  return date ? WEEKDAYS[date.getDay()] : '';
}

export function showDate(iso: string, time: string): string {
  const date = parseIso(iso);
  if (!date) return '';
  const weekday = WEEKDAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];
  return `${weekday} ${date.getDate()} ${month} ${time}`;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

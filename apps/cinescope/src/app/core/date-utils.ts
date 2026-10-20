function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): string {
  return dateToIso(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = isoToDate(iso);
  date.setDate(date.getDate() + days);
  return dateToIso(date);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function resolveSelectedDate(dateParam: string | null): string {
  const today = todayIso();
  if (!dateParam || !isValidIsoDate(dateParam) || dateParam < today) {
    return today;
  }
  return dateParam;
}

export function weekdayFull(iso: string): string {
  return isoToDate(iso).toLocaleDateString('en-US', { weekday: 'long' });
}

export function monthShort(iso: string): string {
  return isoToDate(iso).toLocaleDateString('en-US', { month: 'short' });
}

export interface DayOption {
  date: string;
  label: string;
}

export function buildDayOptions(todayDate: string): DayOption[] {
  const options: DayOption[] = [];
  for (let i = 0; i <= 4; i++) {
    const date = addDays(todayDate, i);
    options.push({ date, label: i === 0 ? 'Today' : weekdayFull(date) });
  }
  return options;
}

export function formatShowDate(iso: string, time: string): string {
  const day = isoToDate(iso).getDate();
  return `${weekdayFull(iso)} ${day} ${monthShort(iso)} ${time}`;
}

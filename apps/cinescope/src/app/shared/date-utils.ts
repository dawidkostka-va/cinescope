const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface DayButton {
  label: string;
  date: string;
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  return formatIsoDate(new Date());
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

export function isValidIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return formatIsoDate(parseIsoDate(value)) === value;
}

export function normalizeDate(raw: string | null): string {
  const today = todayIso();
  if (!isValidIsoDate(raw)) {
    return today;
  }
  return raw < today ? today : raw;
}

export function weekdayName(iso: string): string {
  return WEEKDAYS[parseIsoDate(iso).getDay()];
}

export function formatShowDate(iso: string, time: string): string {
  const date = parseIsoDate(iso);
  return `${weekdayName(iso)} ${date.getDate()} ${MONTHS[date.getMonth()]} ${time}`;
}

export function buildDayButtons(today: string): DayButton[] {
  const buttons: DayButton[] = [{ label: 'Today', date: today }];
  for (let i = 1; i <= 4; i++) {
    const date = addDaysIso(today, i);
    buttons.push({ label: weekdayName(date), date });
  }
  return buttons;
}

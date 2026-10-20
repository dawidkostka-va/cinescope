const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function isoToDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const date = isoToDate(value);
  return dateToIso(date) === value;
}

export function todayIso(): string {
  return dateToIso(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = isoToDate(iso);
  date.setDate(date.getDate() + days);
  return dateToIso(date);
}

export function isBeforeToday(iso: string): boolean {
  return iso < todayIso();
}

export function resolveSelectedDate(param: string | null): string {
  if (!param || !isValidIsoDate(param) || isBeforeToday(param)) {
    return todayIso();
  }
  return param;
}

export function weekdayFull(iso: string): string {
  return WEEKDAYS[isoToDate(iso).getDay()];
}

export function formatShowDate(iso: string, time: string): string {
  const date = isoToDate(iso);
  const weekday = WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  return `${weekday} ${day} ${month} ${time}`;
}

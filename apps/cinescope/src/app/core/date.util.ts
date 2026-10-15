const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function todayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function todayIso(): string {
  return toIsoDate(todayDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function resolveSelectedDate(requested: string | null | undefined): string {
  const today = todayDate();
  if (!requested) {
    return toIsoDate(today);
  }
  const parsed = parseIsoDate(requested);
  if (!parsed || parsed.getTime() < today.getTime()) {
    return toIsoDate(today);
  }
  return requested;
}

export function formatShowDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) {
    return `${isoDate} ${time}`;
  }
  return `${weekdayName(date)} ${date.getDate()} ${MONTHS[date.getMonth()]} ${time}`;
}

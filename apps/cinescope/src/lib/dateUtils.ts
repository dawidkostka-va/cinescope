import dayjs from 'dayjs';

export const ISO_FORMAT = 'YYYY-MM-DD';
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayISO(): string {
  return dayjs().format(ISO_FORMAT);
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.format(ISO_FORMAT) === value;
}

export function isPastDate(iso: string): boolean {
  return iso < todayISO();
}

export function resolveSelectedDate(raw: string | null): string {
  if (raw && isValidIsoDate(raw) && !isPastDate(raw)) {
    return raw;
  }
  return todayISO();
}

export function addDays(iso: string, days: number): string {
  return dayjs(iso).add(days, 'day').format(ISO_FORMAT);
}

export function weekdayFull(iso: string): string {
  return dayjs(iso).format('dddd');
}

export function formatShowDate(date: string, time: string): string {
  return `${dayjs(date).format('dddd D MMM')} ${time}`;
}

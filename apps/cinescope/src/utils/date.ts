import dayjs from 'dayjs';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function today(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.format('YYYY-MM-DD') === value;
}

export function resolveSelectedDate(rawDate: string | null): string {
  const todayIso = today();
  if (!rawDate || !isValidIsoDate(rawDate) || rawDate < todayIso) {
    return todayIso;
  }
  return rawDate;
}

export function addDaysIso(iso: string, days: number): string {
  return dayjs(iso).add(days, 'day').format('YYYY-MM-DD');
}

export function weekdayName(iso: string): string {
  return dayjs(iso).format('dddd');
}

export function formatShowDate(date: string, time: string): string {
  return dayjs(`${date}T${time}`).format('dddd D MMM HH:mm');
}

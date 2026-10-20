import dayjs from 'dayjs';

export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function isValidIsoDate(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return dayjs(value, 'YYYY-MM-DD', true).isValid();
}

export function resolveSelectedDate(param: string | null | undefined): string {
  const today = todayISO();
  if (!isValidIsoDate(param)) return today;
  if (param < today) return today;
  return param;
}

export function weekdayFull(date: string): string {
  return dayjs(date).format('dddd');
}

export function addDaysIso(date: string, days: number): string {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
}

export function formatShowDate(date: string, time: string): string {
  const d = dayjs(date);
  return `${d.format('dddd')} ${d.format('D')} ${d.format('MMM')} ${time}`;
}

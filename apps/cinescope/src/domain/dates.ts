import dayjs from 'dayjs';

const ISO_DATE_FORMAT = 'YYYY-MM-DD';

export function todayISO(): string {
  return dayjs().format(ISO_DATE_FORMAT);
}

export function isValidISODate(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = dayjs(value, ISO_DATE_FORMAT, true);
  return parsed.isValid() && parsed.format(ISO_DATE_FORMAT) === value;
}

export function isPast(dateIso: string): boolean {
  return dateIso < todayISO();
}

export function addDays(dateIso: string, days: number): string {
  return dayjs(dateIso, ISO_DATE_FORMAT).add(days, 'day').format(ISO_DATE_FORMAT);
}

export function weekdayName(dateIso: string): string {
  return dayjs(dateIso, ISO_DATE_FORMAT).format('dddd');
}

export function resolveSelectedDate(dateParam: string | null): string {
  if (!isValidISODate(dateParam) || isPast(dateParam)) {
    return todayISO();
  }
  return dateParam;
}

export function showDate(dateIso: string, time: string): string {
  return dayjs(`${dateIso}T${time}`).format('dddd D MMM HH:mm');
}

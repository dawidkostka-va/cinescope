import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const ISO_FORMAT = 'YYYY-MM-DD';

export function todayISO(): string {
  return dayjs().format(ISO_FORMAT);
}

export function isValidIsoDate(value: string): boolean {
  return dayjs(value, ISO_FORMAT, true).isValid();
}

export function isPastDate(iso: string): boolean {
  return dayjs(iso, ISO_FORMAT, true).isBefore(dayjs().startOf('day'));
}

/** A missing, invalid or past date selects today. */
export function resolveSelectedDate(dateParam: string | null): string {
  if (!dateParam || !isValidIsoDate(dateParam) || isPastDate(dateParam)) {
    return todayISO();
  }
  return dateParam;
}

export function nextDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) => dayjs().add(i, 'day').format(ISO_FORMAT));
}

export function weekdayFull(iso: string): string {
  return dayjs(iso, ISO_FORMAT).format('dddd');
}

/** `<Weekday> <D> <Mon> <HH:mm>`, e.g. "Tuesday 15 Sep 16:00". */
export function formatShowDate(date: string, time: string): string {
  const d = dayjs(date, ISO_FORMAT);
  return `${d.format('dddd')} ${d.date()} ${d.format('MMM')} ${time}`;
}

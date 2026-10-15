import dayjs, { Dayjs } from 'dayjs';

export const ISO_DATE_FORMAT = 'YYYY-MM-DD';

export function todayISO(): string {
  return dayjs().format(ISO_DATE_FORMAT);
}

export function isValidIsoDate(value: string | null): value is string {
  if (!value) return false;
  return dayjs(value, ISO_DATE_FORMAT, true).isValid();
}

/** Resolves a `date` query param: missing, invalid, or in the past all resolve to today. */
export function resolveSelectedDate(value: string | null): string {
  const today = todayISO();
  if (!isValidIsoDate(value)) return today;
  return value < today ? today : value;
}

export function weekdayName(date: Dayjs): string {
  return date.format('dddd');
}

/** `<Weekday> <D> <Mon> <HH:mm>`, e.g. `Tuesday 15 Sep 16:00`. */
export function formatShowDate(isoDate: string, time: string): string {
  return dayjs(`${isoDate}T${time}`).format('dddd D MMM HH:mm');
}

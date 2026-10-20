import dayjs, { Dayjs } from 'dayjs';

export const ISO_DATE_FORMAT = 'YYYY-MM-DD';

export function today(): Dayjs {
  return dayjs().startOf('day');
}

export function toIsoDate(date: Dayjs): string {
  return date.format(ISO_DATE_FORMAT);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.format(ISO_DATE_FORMAT) === value;
}

export function isPastDate(isoDate: string): boolean {
  return dayjs(isoDate).isBefore(today(), 'day');
}

/** Resolves a `date` search param to a selected day: a missing, invalid or past date selects today. */
export function resolveSelectedDate(param: string | null): string {
  if (param && isValidIsoDate(param) && !isPastDate(param)) {
    return param;
  }
  return toIsoDate(today());
}

export function formatShowDate(isoDate: string, time: string): string {
  return dayjs(`${isoDate}T${time}`).format('dddd D MMM HH:mm');
}

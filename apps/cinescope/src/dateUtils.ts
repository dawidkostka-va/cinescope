import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const ISO_DATE_FORMAT = 'YYYY-MM-DD';

export function today(): Dayjs {
  return dayjs().startOf('day');
}

/** A missing, invalid or past date resolves to today. */
export function parseDateParam(raw: string | null): Dayjs {
  const todayDate = today();
  if (!raw) {
    return todayDate;
  }
  const parsed = dayjs(raw, ISO_DATE_FORMAT, true);
  if (!parsed.isValid()) {
    return todayDate;
  }
  if (parsed.isBefore(todayDate, 'day')) {
    return todayDate;
  }
  return parsed;
}

export function toISODate(date: Dayjs): string {
  return date.format(ISO_DATE_FORMAT);
}

/** `<Weekday> <D> <Mon> <HH:mm>`, e.g. "Tuesday 15 Sep 16:00". */
export function formatShowDate(date: string, time: string): string {
  return dayjs(`${date}T${time}`, `${ISO_DATE_FORMAT}THH:mm`).format('dddd D MMM HH:mm');
}

import dayjs, { Dayjs } from 'dayjs';

export const ISO_DATE_FORMAT = 'YYYY-MM-DD';

export function today(): Dayjs {
  return dayjs().startOf('day');
}

export function parseIsoDate(value: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value, ISO_DATE_FORMAT, true);
  return parsed.isValid() ? parsed.startOf('day') : null;
}

export function formatShowDate(date: string, time: string): string {
  return dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm').format('dddd D MMM HH:mm');
}

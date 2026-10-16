import dayjs from 'dayjs';

export const ISO_DATE_FORMAT = 'YYYY-MM-DD';

export function todayISO(): string {
  return dayjs().format(ISO_DATE_FORMAT);
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.format(ISO_DATE_FORMAT) === value;
}

export function resolveSelectedDate(param: string | null): string {
  const today = todayISO();
  if (!param || !isValidISODate(param)) return today;
  return param < today ? today : param;
}

export function nextDays(startDateISO: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    dayjs(startDateISO).add(i + 1, 'day').format(ISO_DATE_FORMAT),
  );
}

export function weekdayFull(dateISO: string): string {
  return dayjs(dateISO).format('dddd');
}

export function formatShowDate(dateISO: string, time: string): string {
  const d = dayjs(`${dateISO}T${time}`);
  return `${d.format('dddd')} ${d.date()} ${d.format('MMM')} ${time}`;
}

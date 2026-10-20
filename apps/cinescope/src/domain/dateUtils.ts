import dayjs from 'dayjs';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayIso(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.format('YYYY-MM-DD') === value;
}

/** A missing, invalid or past date resolves to today. */
export function resolveSelectedDate(dateParam: string | null): string {
  const today = getTodayIso();
  if (!dateParam || !isValidIsoDate(dateParam) || dateParam < today) {
    return today;
  }
  return dateParam;
}

export interface DayOption {
  iso: string;
  label: string;
}

/** Today, then the next four days labelled by their English weekday name. */
export function getDayOptions(): DayOption[] {
  const today = dayjs();
  return Array.from({ length: 5 }, (_, i) => {
    const day = today.add(i, 'day');
    return {
      iso: day.format('YYYY-MM-DD'),
      label: i === 0 ? 'Today' : day.format('dddd'),
    };
  });
}

/** `<Weekday> <D> <Mon> <HH:mm>`, e.g. "Tuesday 15 Sep 16:00". */
export function formatShowDate(isoDate: string, time: string): string {
  const day = dayjs(isoDate);
  return `${day.format('dddd')} ${day.format('D')} ${day.format('MMM')} ${time}`;
}

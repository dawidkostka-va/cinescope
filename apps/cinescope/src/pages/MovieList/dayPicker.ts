import dayjs from 'dayjs';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function resolveSelectedDate(dateParam: string | null): string {
  const today = todayIso();
  if (!dateParam || !ISO_DATE_PATTERN.test(dateParam)) {
    return today;
  }
  const parsed = dayjs(dateParam);
  if (!parsed.isValid() || parsed.format('YYYY-MM-DD') !== dateParam) {
    return today;
  }
  if (parsed.isBefore(dayjs().startOf('day'))) {
    return today;
  }
  return dateParam;
}

export interface DayOption {
  iso: string;
  label: string;
}

export function dayOptions(): DayOption[] {
  return Array.from({ length: 5 }, (_, i) => {
    const date = dayjs().add(i, 'day');
    return { iso: date.format('YYYY-MM-DD'), label: i === 0 ? 'Today' : date.format('dddd') };
  });
}

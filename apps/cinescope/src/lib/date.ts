import dayjs from 'dayjs';

const ISO_DATE_FORMAT = 'YYYY-MM-DD';

export function todayISO(): string {
  return dayjs().format(ISO_DATE_FORMAT);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return dayjs(value, ISO_DATE_FORMAT, true).isValid();
}

export function resolveSelectedDate(dateParam: string | null): string {
  const today = todayISO();
  if (!dateParam || !isValidIsoDate(dateParam)) {
    return today;
  }
  if (dateParam < today) {
    return today;
  }
  return dateParam;
}

export interface DayOption {
  date: string;
  label: string;
}

export function upcomingDayOptions(): DayOption[] {
  const today = dayjs();
  const options: DayOption[] = [];
  for (let i = 0; i < 5; i++) {
    const day = today.add(i, 'day');
    options.push({
      date: day.format(ISO_DATE_FORMAT),
      label: i === 0 ? 'Today' : day.format('dddd'),
    });
  }
  return options;
}

export function formatShowDate(date: string, time: string): string {
  return dayjs(`${date}T${time}`).format('dddd D MMM HH:mm');
}

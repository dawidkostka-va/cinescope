const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats a screening as `<Weekday> <D> <Mon> <HH:mm>`, e.g. `Tuesday 15 Sep 16:00`. */
export function formatShowDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) {
    return `${isoDate} ${time}`;
  }
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${time}`;
}

/** Formats a date as `YYYY-MM-DD` in the browser's local time zone. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` string into a local date, or returns `null` if it is not a real calendar date. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = value ? ISO_DATE.exec(value) : null;
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : null;
}

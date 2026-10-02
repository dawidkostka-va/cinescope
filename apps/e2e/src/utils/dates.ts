import type { Screening } from '../types/index.js';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `Tuesday 15 Sep 16:00` — the show-date format of section 3.3. Calendar maths only, no zone. */
export function showDate({ date, time }: Screening): string {
  const [year, month, day] = date.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Not an ISO date: ${date}`);
  }
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${String(weekday)} ${String(day)} ${String(MONTHS[month - 1])} ${time}`;
}

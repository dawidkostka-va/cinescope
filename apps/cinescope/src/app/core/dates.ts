const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIsoDate(value: string | null): Date | null {
  const match = value === null ? null : /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  date.setFullYear(year);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : null;
}

export function weekdayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function showDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) {
    return `${isoDate} ${time}`;
  }
  return `${weekdayName(date)} ${date.getDate()} ${MONTHS[date.getMonth()]} ${time}`;
}

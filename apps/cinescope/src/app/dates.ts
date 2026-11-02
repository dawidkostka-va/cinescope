const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseIso(s: string | null | undefined): Date | null {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) : null;
  if (!m) return null;
  const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(y, mo - 1, da);
  return d.getFullYear() === y && d.getMonth() === mo - 1 && d.getDate() === da ? d : null;
}

export function weekday(d: Date): string {
  return WEEKDAYS[d.getDay()];
}

export function showDate(isoDate: string, time: string): string {
  const d = parseIso(isoDate);
  if (!d) return `${isoDate} ${time}`;
  return `${weekday(d)} ${d.getDate()} ${MONTHS[d.getMonth()]} ${time}`;
}

export function formatPrice(n: number): string {
  return `${n.toFixed(2)} PLN`;
}

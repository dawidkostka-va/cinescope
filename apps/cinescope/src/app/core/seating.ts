export const ROWS = 15;
export const COLUMNS = 24;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export interface BookingItem {
  row: number;
  columnStart: number;
  columnEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const COUCH_PRICE = 89;

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function makeItem(row: number, column: number): BookingItem {
  if (row === COUCH_ROW) {
    const start = column % 2 === 1 ? column : column - 1;
    return {
      row,
      columnStart: start,
      columnEnd: start + 1,
      couch: true,
      ids: [seatId(row, start), seatId(row, start + 1)],
      price: COUCH_PRICE,
    };
  }
  return { row, columnStart: column, columnEnd: column, couch: false, ids: [seatId(row, column)], price: seatPrice(row) };
}

export function itemsFromSeats(seats: string[]): BookingItem[] {
  const byKey = new Map<string, BookingItem>();
  for (const id of seats) {
    const match = /^R(\d+)C(\d+)$/.exec(id);
    if (!match) continue;
    const item = makeItem(Number(match[1]), Number(match[2]));
    byKey.set(`${item.row}-${item.columnStart}`, item);
  }
  return [...byKey.values()].sort((a, b) => a.row - b.row || a.columnStart - b.columnStart);
}

export function itemDescription(item: BookingItem): string {
  return item.couch ? `Couch ${item.columnStart}-${item.columnEnd}` : String(item.columnStart);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function formatShowDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return `${isoDate} ${time}`;
  return `${weekdayName(date)} ${date.getDate()} ${MONTHS[date.getMonth()]} ${time}`;
}

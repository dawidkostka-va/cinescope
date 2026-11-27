export const MAX_SEATS = 10;
export const ROW_COUNT = 15;
export const COUCH_ROW = 15;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface TicketItem {
  row: number;
  colStart: number;
  colEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } | null {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  return match ? { row: Number(match[1]), column: Number(match[2]) } : null;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const COUCH_PRICE = 89;

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export function compareSeatIds(a: string, b: string): number {
  const pa = parseSeatId(a);
  const pb = parseSeatId(b);
  if (!pa || !pb) return a.localeCompare(b);
  return pa.row - pb.row || pa.column - pb.column;
}

export function itemsFromSeats(seats: string[]): TicketItem[] {
  const items = new Map<string, TicketItem>();
  for (const id of [...seats].sort(compareSeatIds)) {
    const seat = parseSeatId(id);
    if (!seat) continue;
    if (seat.row === COUCH_ROW) {
      const start = seat.column % 2 === 1 ? seat.column : seat.column - 1;
      const key = `${seat.row}-${start}`;
      const existing = items.get(key);
      if (existing) {
        existing.ids.push(id);
      } else {
        items.set(key, {
          row: seat.row,
          colStart: start,
          colEnd: start + 1,
          couch: true,
          ids: [id],
          price: COUCH_PRICE,
        });
      }
    } else {
      items.set(id, {
        row: seat.row,
        colStart: seat.column,
        colEnd: seat.column,
        couch: false,
        ids: [id],
        price: priceForRow(seat.row),
      });
    }
  }
  return [...items.values()];
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function showDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return `${isoDate} ${time}`;
  return `${weekdayName(date)} ${date.getDate()} ${MONTHS[date.getMonth()]} ${time}`;
}

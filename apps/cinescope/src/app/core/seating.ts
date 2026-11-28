export const MAX_SEATS = 10;
export const ROWS = 15;
export const COUCH_ROW = 15;

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

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const COUCH_PRICE = 89;

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function couchStart(column: number): number {
  return column % 2 === 0 ? column - 1 : column;
}

export function couchIds(start: number): string[] {
  return [seatId(COUCH_ROW, start), seatId(COUCH_ROW, start + 1)];
}

export function itemIds(row: number, colStart: number): string[] {
  return row === COUCH_ROW ? couchIds(colStart) : [seatId(row, colStart)];
}

export function buildItems(ids: readonly string[]): TicketItem[] {
  const items = new Map<string, TicketItem>();
  for (const id of ids) {
    const parsed = parseSeatId(id);
    if (!parsed) continue;
    const { row, column } = parsed;
    if (row === COUCH_ROW) {
      const start = couchStart(column);
      items.set(seatId(row, start), {
        row,
        colStart: start,
        colEnd: start + 1,
        couch: true,
        ids: couchIds(start),
        price: COUCH_PRICE,
      });
    } else {
      items.set(id, { row, colStart: column, colEnd: column, couch: false, ids: [id], price: seatPrice(row) });
    }
  }
  return [...items.values()].sort((a, b) => a.row - b.row || a.colStart - b.colStart);
}

export function itemSeatCount(item: TicketItem): number {
  return item.ids.length;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function toIsoDate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  date.setFullYear(y);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function formatShowDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return `${isoDate} ${time}`;
  return `${weekdayName(date)} ${date.getDate()} ${MONTHS[date.getMonth()]} ${time}`;
}

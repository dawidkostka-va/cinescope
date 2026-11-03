export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const MAX_SEATS = 10;
export const ROWS = 15;
export const COUCH_ROW = 15;

export interface Item {
  row: number;
  colStart: number;
  colEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export const seatId = (row: number, column: number) => `R${row}C${column}`;

export function parseSeatId(id: string): { row: number; column: number } | null {
  const m = /^R(\d+)C(\d+)$/.exec(id);
  return m ? { row: +m[1], column: +m[2] } : null;
}

export function priceOf(row: number, couch: boolean): number {
  if (couch) return 89;
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function firstColumn(row: number): number {
  return row <= 10 ? 5 : 1;
}

export function itemFor(row: number, colStart: number): Item {
  const couch = row === COUCH_ROW;
  const colEnd = couch ? colStart + 1 : colStart;
  const ids = couch ? [seatId(row, colStart), seatId(row, colEnd)] : [seatId(row, colStart)];
  return { row, colStart, colEnd, couch, ids, price: priceOf(row, couch) };
}

export function itemsFromSeats(seats: string[]): Item[] {
  const items = new Map<string, Item>();
  for (const id of seats) {
    const parsed = parseSeatId(id);
    if (!parsed) continue;
    const start = parsed.row === COUCH_ROW && parsed.column % 2 === 0 ? parsed.column - 1 : parsed.column;
    const item = itemFor(parsed.row, start);
    items.set(item.ids[0], item);
  }
  return [...items.values()].sort((a, b) => a.row - b.row || a.colStart - b.colStart);
}

export function itemLabel(item: Item): string {
  return item.couch ? `${item.colStart}-${item.colEnd}` : String(item.colStart);
}

export function totalOf(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

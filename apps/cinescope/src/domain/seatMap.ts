export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMNS = [10, 11, 12, 13, 14, 15];
export const MAX_SEATS = 10;

export const AISLE_AFTER_COLUMN_LEFT = 4;
export const AISLE_AFTER_COLUMN_RIGHT = 20;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isCouchRow(row: number): boolean {
  return row === COUCH_ROW;
}

export function isAccessible(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && ACCESSIBLE_COLUMNS.includes(column);
}

export function rowHasBlockOne(row: number): boolean {
  return row >= 11;
}

/** Start column of the couch pair that contains `column`, e.g. 5 or 6 -> 5. */
export function couchPairStart(column: number): number {
  return column % 2 === 1 ? column : column - 1;
}

export function couchSeatIds(row: number, pairStart: number): [string, string] {
  return [seatId(row, pairStart), seatId(row, pairStart + 1)];
}

/** All couch pair start columns, in ascending order. */
export function couchPairStarts(): number[] {
  const starts: number[] = [];
  for (let column = 1; column <= COLUMN_COUNT; column += 2) {
    starts.push(column);
  }
  return starts;
}

export function priceForRow(row: number): number {
  if (row >= 1 && row <= 5) return 25;
  if (row >= 6 && row <= 10) return 32;
  if (row >= 11 && row <= 14) return 39;
  throw new Error(`No per-seat price for row ${row}`);
}

export const COUCH_PRICE = 89;

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

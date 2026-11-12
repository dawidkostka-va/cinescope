export const ROW_COUNT = 15;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export interface SeatRef {
  row: number;
  col: number;
}

export function keyOf(row: number, col: number): string {
  return `R${row}C${col}`;
}

export function parseKey(key: string): SeatRef {
  const m = /^R(\d+)C(\d+)$/.exec(key);
  return { row: Number(m?.[1]), col: Number(m?.[2]) };
}

export function isCouchKey(key: string): boolean {
  return parseKey(key).row === COUCH_ROW;
}

export function seatCount(key: string): number {
  return isCouchKey(key) ? 2 : 1;
}

/** Seat identifiers a key stands for; a couch contributes both of its identifiers. */
export function seatIds(key: string): string[] {
  const { row, col } = parseKey(key);
  return row === COUCH_ROW ? [key, keyOf(row, col + 1)] : [key];
}

export function compareKeys(a: string, b: string): number {
  const x = parseKey(a);
  const y = parseKey(b);
  return x.row - y.row || x.col - y.col;
}

export function priceOf(key: string): number {
  const { row } = parseKey(key);
  if (row === COUCH_ROW) return 89;
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function totalSeats(keys: readonly string[]): number {
  return keys.reduce((sum, k) => sum + seatCount(k), 0);
}

export function totalPrice(keys: readonly string[]): number {
  return keys.reduce((sum, k) => sum + priceOf(k), 0);
}

export function pln(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

/** Summary description: `12` or `Couch 3-4`. */
export function describeSeat(key: string): string {
  const { col } = parseKey(key);
  return isCouchKey(key) ? `Couch ${col}-${col + 1}` : String(col);
}

/** Selected-seats panel description: `12` or `3-4`. */
export function describeShort(key: string): string {
  const { col } = parseKey(key);
  return isCouchKey(key) ? `${col}-${col + 1}` : String(col);
}

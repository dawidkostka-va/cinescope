/**
 * Every number the frozen specification fixes about the auditorium lives here, so that a
 * change to the spec is a change to exactly one file in this suite.
 */

export const ROWS = 15;
export const COLUMNS = 24;

/** An aisle is rendered after each of these columns; it is two seats wide. */
export const AISLE_AFTER_COLUMN = [4, 20] as const;

/** Rows 1-10 have no left block: columns 1-4 are the entrance, not seats. */
export const ROWS_WITHOUT_LEFT_BLOCK = { from: 1, to: 10 } as const;
export const LEFT_BLOCK_COLUMNS = { from: 1, to: 4 } as const;

export const ACCESSIBLE = { row: 1, columns: { from: 10, to: 15 } } as const;

export const COUCH_ROW = 15;

export const MAX_SEATS_PER_BOOKING = 10;
export const SEATS_PER_COUCH = 2;

export const PRICES = {
  /** Rows 1-5, closest to the screen. */
  front: 25,
  /** Rows 6-10. */
  middle: 32,
  /** Rows 11-15, farthest from the screen. */
  back: 39,
  /** Per couch, not per seat — row 15 only. */
  couch: 89,
} as const;

export const EXPECTED_PHYSICAL_SEATS = 320;
export const EXPECTED_SELECTABLE_ELEMENTS = 308;

export const TOASTS = {
  seatLimit: 'Maximum 10 seats per booking',
  invalidForm: 'The form contains errors',
  paymentFailed: 'Payment failed. Please try again.',
  moviesFailed: 'Failed to load movies',
} as const;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

/** `R7C12` — the identifier scheme shared by `db.json` and the seat map. */
export function seatId(row: number, column: number): string {
  return `R${String(row)}C${String(column)}`;
}

export function hasLeftBlock(row: number): boolean {
  return row < ROWS_WITHOUT_LEFT_BLOCK.from || row > ROWS_WITHOUT_LEFT_BLOCK.to;
}

export function columnsInRow(row: number): number[] {
  const first = hasLeftBlock(row) ? 1 : LEFT_BLOCK_COLUMNS.to + 1;
  return range(first, COLUMNS);
}

export function isAccessible(row: number, column: number): boolean {
  return row === ACCESSIBLE.row && column >= ACCESSIBLE.columns.from && column <= ACCESSIBLE.columns.to;
}

/** Row 15 only: `[[1, 2], [3, 4], ... [23, 24]]`. */
export function couchPairs(): [number, number][] {
  const pairs: [number, number][] = [];
  for (let column = 1; column < COLUMNS; column += SEATS_PER_COUCH) {
    pairs.push([column, column + 1]);
  }
  return pairs;
}

export function priceOf(row: number): number {
  if (row === COUCH_ROW) return PRICES.couch;
  if (row <= 5) return PRICES.front;
  if (row <= 10) return PRICES.middle;
  return PRICES.back;
}

export function physicalSeatCount(): number {
  return range(1, ROWS).reduce((total, row) => total + columnsInRow(row).length, 0);
}

export function selectableElementCount(): number {
  return range(1, ROWS).reduce(
    (total, row) =>
      total + (row === COUCH_ROW ? couchPairs().length : columnsInRow(row).length),
    0,
  );
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

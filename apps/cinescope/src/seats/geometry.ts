export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMNS = [10, 11, 12, 13, 14, 15];
export const MAX_SEATS_PER_BOOKING = 10;

export const LEFT_BLOCK_COLUMNS = [1, 2, 3, 4];
export const MIDDLE_BLOCK_COLUMNS = Array.from({ length: 16 }, (_, i) => i + 5); // 5..20
export const RIGHT_BLOCK_COLUMNS = [21, 22, 23, 24];

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const SEAT_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

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

export function hasLeftBlock(row: number): boolean {
  return row >= 11;
}

export function isAccessible(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && ACCESSIBLE_COLUMNS.includes(column);
}

export function isCouchRow(row: number): boolean {
  return row === COUCH_ROW;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  return 89;
}

/** Groups a sorted, contiguous list of columns into adjacent couch pairs. */
export function toCouchPairs(columns: number[]): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < columns.length; i += 2) {
    pairs.push([columns[i], columns[i + 1]]);
  }
  return pairs;
}

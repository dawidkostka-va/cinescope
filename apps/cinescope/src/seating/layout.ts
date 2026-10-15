export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const MAX_SEATS_PER_BOOKING = 10;

export function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}

export function isAccessibleSeat(row: number, col: number): boolean {
  return row === 1 && col >= 10 && col <= 15;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  return 89;
}

export interface RowBlocks {
  left: number[];
  middle: number[];
  right: number[];
}

export function getRowBlocks(row: number): RowBlocks {
  const left = row >= 11 ? range(1, 4) : [];
  const middle = range(5, 20);
  const right = range(21, 24);
  return { left, middle, right };
}

export function toCouchPairs(cols: number[]): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < cols.length; i += 2) {
    pairs.push([cols[i], cols[i + 1]]);
  }
  return pairs;
}

export function seatId(row: number, col: number): string {
  return `R${row}C${col}`;
}

export const ROW_COUNT = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMNS = [10, 11, 12, 13, 14, 15];
export const COUCH_ROW = 15;
export const COUCH_PRICE = 89;
export const MAX_SEATS_PER_BOOKING = 10;

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

export function isAccessible(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && ACCESSIBLE_COLUMNS.includes(column);
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function blockColumns(row: number): { a: number[]; b: number[]; c: number[] } {
  const a = row > 10 ? [1, 2, 3, 4] : [];
  const b = Array.from({ length: 16 }, (_, i) => i + 5);
  const c = [21, 22, 23, 24];
  return { a, b, c };
}

export function couchPairForColumn(column: number): [number, number] {
  const start = column % 2 === 0 ? column - 1 : column;
  return [start, start + 1];
}

export type Cell =
  | { kind: 'seat'; column: number }
  | { kind: 'couch'; columns: [number, number] };

export function toCells(columns: number[], isCouchRow: boolean): Cell[] {
  if (!isCouchRow) {
    return columns.map((column) => ({ kind: 'seat', column }));
  }
  const cells: Cell[] = [];
  for (let i = 0; i < columns.length; i += 2) {
    cells.push({ kind: 'couch', columns: [columns[i], columns[i + 1]] });
  }
  return cells;
}

export function gridColumn(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

export const LEFT_LABEL_COLUMN = 1;
export const AISLE_1_COLUMN = 6;
export const AISLE_2_COLUMN = 23;
export const RIGHT_LABEL_COLUMN = 28;

export function seatState(row: number, column: number, occupied: boolean, selected: boolean): SeatState {
  if (occupied) return 'unavailable';
  if (selected) return 'selected';
  if (isAccessible(row, column)) return 'accessible';
  return 'available';
}

export function couchState(occupiedA: boolean, occupiedB: boolean, selected: boolean): SeatState {
  if (occupiedA || occupiedB) return 'unavailable';
  if (selected) return 'selected';
  return 'available';
}

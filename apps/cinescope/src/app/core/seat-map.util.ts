export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMNS = [10, 11, 12, 13, 14, 15];
export const MAX_SEATS_PER_BOOKING = 10;
export const COUCH_PRICE = 89;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatCell {
  type: 'seat';
  row: number;
  column: number;
}

export interface CouchCell {
  type: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
}

export interface AisleCell {
  type: 'aisle';
  row: number;
  track: number;
}

export type RowCell = SeatCell | CouchCell | AisleCell;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function trackForColumn(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

export const LABEL_LEFT_TRACK = 1;
export const LABEL_RIGHT_TRACK = 28;
export const AISLE_TRACKS = [6, 23];

export function hasEntrance(row: number): boolean {
  return row <= 10;
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && ACCESSIBLE_COLUMNS.includes(column);
}

export function buildRowCells(row: number): RowCell[] {
  const cells: RowCell[] = [];
  const isCouchRow = row === COUCH_ROW;
  const entrance = hasEntrance(row);

  if (isCouchRow) {
    cells.push({ type: 'couch', row, columnStart: 1, columnEnd: 2 });
    cells.push({ type: 'couch', row, columnStart: 3, columnEnd: 4 });
  } else if (!entrance) {
    for (let column = 1; column <= 4; column++) {
      cells.push({ type: 'seat', row, column });
    }
  }

  cells.push({ type: 'aisle', row, track: AISLE_TRACKS[0] });

  if (isCouchRow) {
    for (let column = 5; column <= 19; column += 2) {
      cells.push({ type: 'couch', row, columnStart: column, columnEnd: column + 1 });
    }
  } else {
    for (let column = 5; column <= 20; column++) {
      cells.push({ type: 'seat', row, column });
    }
  }

  cells.push({ type: 'aisle', row, track: AISLE_TRACKS[1] });

  if (isCouchRow) {
    cells.push({ type: 'couch', row, columnStart: 21, columnEnd: 22 });
    cells.push({ type: 'couch', row, columnStart: 23, columnEnd: 24 });
  } else {
    for (let column = 21; column <= 24; column++) {
      cells.push({ type: 'seat', row, column });
    }
  }

  return cells;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function priceForSeat(row: number): number {
  if (row === COUCH_ROW) return COUCH_PRICE;
  return priceForRow(row);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export function isCouchIds(seatIds: string[]): boolean {
  return seatIds.length === 2;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) throw new Error(`Invalid seat id: ${id}`);
  return { row: Number(match[1]), column: Number(match[2]) };
}

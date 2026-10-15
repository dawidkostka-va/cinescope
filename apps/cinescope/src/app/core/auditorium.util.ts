import { seatId } from './seat.util';

export const TOTAL_ROWS = 15;
export const TOTAL_COLUMNS = 24;
export const COUCH_ROW = 15;

export const LEFT_LABEL_TRACK = 1;
export const AISLE_TRACK_1 = 6;
export const AISLE_TRACK_2 = 23;
export const RIGHT_LABEL_TRACK = 28;

/** Maps a global seat column (1-24) to its CSS grid track within a row. */
export function columnTrack(column: number): number {
  if (column <= 4) return column + 1; // tracks 2-5
  if (column <= 20) return column + 2; // tracks 7-22
  return column + 3; // tracks 24-27
}

export interface SeatCell {
  kind: 'seat';
  column: number;
  track: number;
  accessible: boolean;
  id: string;
}

export interface CouchCell {
  kind: 'couch';
  columnStart: number;
  columnEnd: number;
  trackStart: number;
  ids: [string, string];
}

export interface AisleCell {
  kind: 'aisle';
  track: number;
}

export interface EmptyCell {
  kind: 'empty';
  trackStart: number;
}

export type RowCell = SeatCell | CouchCell | AisleCell | EmptyCell;

export interface RowLayout {
  row: number;
  cells: RowCell[];
}

function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

function buildBlock(row: number, colStart: number, colEnd: number): RowCell[] {
  if (row === COUCH_ROW) {
    const cells: RowCell[] = [];
    for (let c = colStart; c <= colEnd; c += 2) {
      cells.push({
        kind: 'couch',
        columnStart: c,
        columnEnd: c + 1,
        trackStart: columnTrack(c),
        ids: [seatId(row, c), seatId(row, c + 1)],
      });
    }
    return cells;
  }

  if (colStart === 1 && row <= 10) {
    return [{ kind: 'empty', trackStart: columnTrack(1) }];
  }

  const cells: RowCell[] = [];
  for (let c = colStart; c <= colEnd; c++) {
    cells.push({ kind: 'seat', column: c, track: columnTrack(c), accessible: isAccessible(row, c), id: seatId(row, c) });
  }
  return cells;
}

function buildRow(row: number): RowLayout {
  return {
    row,
    cells: [
      ...buildBlock(row, 1, 4),
      { kind: 'aisle', track: AISLE_TRACK_1 },
      ...buildBlock(row, 5, 20),
      { kind: 'aisle', track: AISLE_TRACK_2 },
      ...buildBlock(row, 21, 24),
    ],
  };
}

export const ROW_LAYOUTS: RowLayout[] = Array.from({ length: TOTAL_ROWS }, (_, i) => buildRow(i + 1));

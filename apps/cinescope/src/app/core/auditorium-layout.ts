import { COUCH_ROW, TOTAL_ROWS, isAccessible } from './seats';

export type AuditoriumCell =
  | { kind: 'seat' | 'accessible'; row: number; column: number; gridColumn: number }
  | { kind: 'couch'; row: number; columnStart: number; columnEnd: number; gridColumn: number };

export interface AuditoriumRow {
  row: number;
  cells: AuditoriumCell[];
}

/** The two aisles sit in fixed grid tracks, identical for every row. */
export const AISLE_GRID_COLUMNS = [6, 23] as const;
export const LABEL_LEFT_GRID_COLUMN = 1;
export const LABEL_RIGHT_GRID_COLUMN = 28;

function gridColumnForSeat(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

function buildRow(row: number): AuditoriumRow {
  const hasLeftBlock = row >= 11;
  const blocks: Array<[number, number]> = hasLeftBlock
    ? [
        [1, 4],
        [5, 20],
        [21, 24],
      ]
    : [
        [5, 20],
        [21, 24],
      ];

  const cells: AuditoriumCell[] = [];
  for (const [start, end] of blocks) {
    if (row === COUCH_ROW) {
      for (let column = start; column <= end; column += 2) {
        cells.push({
          kind: 'couch',
          row,
          columnStart: column,
          columnEnd: column + 1,
          gridColumn: gridColumnForSeat(column),
        });
      }
    } else {
      for (let column = start; column <= end; column++) {
        cells.push({
          kind: isAccessible(row, column) ? 'accessible' : 'seat',
          row,
          column,
          gridColumn: gridColumnForSeat(column),
        });
      }
    }
  }
  return { row, cells };
}

export const AUDITORIUM_ROWS: AuditoriumRow[] = Array.from({ length: TOTAL_ROWS }, (_, i) => buildRow(i + 1));

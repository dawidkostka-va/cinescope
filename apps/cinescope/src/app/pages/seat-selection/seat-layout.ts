import { isAccessibleSeat } from '../../utils/seat.util';

export type SeatCell =
  | { kind: 'aisle'; track: number }
  | { kind: 'seat'; column: number; track: number; accessible: boolean }
  | { kind: 'couch'; start: number; end: number; track: number };

export interface SeatRow {
  row: number;
  cells: SeatCell[];
}

const AISLE_1_TRACK = 6;
const AISLE_2_TRACK = 23;

export function trackForColumn(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

export function buildAuditoriumRows(): SeatRow[] {
  const rows: SeatRow[] = [];
  for (let row = 1; row <= 15; row++) {
    const cells: SeatCell[] = [
      { kind: 'aisle', track: AISLE_1_TRACK },
      { kind: 'aisle', track: AISLE_2_TRACK },
    ];
    if (row === 15) {
      for (let start = 1; start <= 23; start += 2) {
        cells.push({ kind: 'couch', start, end: start + 1, track: trackForColumn(start) });
      }
    } else {
      const startColumn = row <= 10 ? 5 : 1;
      for (let column = startColumn; column <= 24; column++) {
        cells.push({ kind: 'seat', column, track: trackForColumn(column), accessible: isAccessibleSeat(row, column) });
      }
    }
    cells.sort((a, b) => a.track - b.track);
    rows.push({ row, cells });
  }
  return rows;
}

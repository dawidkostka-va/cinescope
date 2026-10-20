import { isAccessibleSeat } from '../../utils/seats';

export const SEAT_PX = 32;
export const AISLE_PX = SEAT_PX * 2;
export const ROW_LABEL_PX = 28;
export const TOTAL_ROWS = 15;
export const TOTAL_COLUMNS = 24;

export const ROW_GRID_TEMPLATE_COLUMNS = [
  `${ROW_LABEL_PX}px`,
  `repeat(4, ${SEAT_PX}px)`,
  `${AISLE_PX}px`,
  `repeat(16, ${SEAT_PX}px)`,
  `${AISLE_PX}px`,
  `repeat(4, ${SEAT_PX}px)`,
  `${ROW_LABEL_PX}px`,
].join(' ');

export type RowCell =
  | { kind: 'empty'; column: number }
  | { kind: 'seat'; column: number; accessible: boolean }
  | { kind: 'couch'; columnStart: number; columnEnd: number }
  | { kind: 'aisle' };

export function buildRowCells(row: number): RowCell[] {
  const cells: RowCell[] = [];

  if (row === 15) {
    for (let start = 1; start <= TOTAL_COLUMNS - 1; start += 2) {
      if (start === 5 || start === 21) {
        cells.push({ kind: 'aisle' });
      }
      cells.push({ kind: 'couch', columnStart: start, columnEnd: start + 1 });
    }
    return cells;
  }

  for (let column = 1; column <= TOTAL_COLUMNS; column++) {
    if (column === 5 || column === 21) {
      cells.push({ kind: 'aisle' });
    }
    if (row <= 10 && column <= 4) {
      cells.push({ kind: 'empty', column });
    } else {
      cells.push({ kind: 'seat', column, accessible: isAccessibleSeat(row, column) });
    }
  }

  return cells;
}

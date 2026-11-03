import { COLUMNS, ROWS, firstColumn, isAccessible, priceOf, seatId } from '../core/seats';

export const ROW_NUMBERS = Array.from({ length: ROWS }, (_, i) => i + 1);

const LEFT_AISLE_TRACK = 6;
const RIGHT_AISLE_TRACK = 23;
const LEFT_LABEL_TRACK = 1;
const RIGHT_LABEL_TRACK = 28;

export function columnTrack(column: number): number {
  if (column <= 4) {
    return column + 1;
  }
  if (column <= 20) {
    return column + 2;
  }
  return column + 3;
}

export type Cell =
  | { kind: 'label'; side: 'left' | 'right'; row: number; track: number }
  | { kind: 'aisle'; row: number; track: number }
  | { kind: 'seat'; row: number; column: number; id: string; track: number; accessible: boolean; price: number }
  | { kind: 'couch'; row: number; start: number; end: number; ids: [string, string]; track: number; price: number };

export type Bookable = Extract<Cell, { kind: 'seat' | 'couch' }>;

export interface RowLayout {
  row: number;
  cells: Cell[];
}

function rowCells(row: number): Cell[] {
  const cells: Cell[] = [
    { kind: 'label', side: 'left', row, track: LEFT_LABEL_TRACK },
    { kind: 'aisle', row, track: LEFT_AISLE_TRACK },
    { kind: 'aisle', row, track: RIGHT_AISLE_TRACK },
    { kind: 'label', side: 'right', row, track: RIGHT_LABEL_TRACK },
  ];
  if (row === ROWS) {
    for (let start = 1; start < COLUMNS; start += 2) {
      cells.push({
        kind: 'couch',
        row,
        start,
        end: start + 1,
        ids: [seatId(row, start), seatId(row, start + 1)],
        track: columnTrack(start),
        price: priceOf(row),
      });
    }
  } else {
    for (let column = firstColumn(row); column <= COLUMNS; column++) {
      cells.push({
        kind: 'seat',
        row,
        column,
        id: seatId(row, column),
        track: columnTrack(column),
        accessible: isAccessible(row, column),
        price: priceOf(row),
      });
    }
  }
  return cells;
}

export const AUDITORIUM: RowLayout[] = ROW_NUMBERS.map((row) => ({ row, cells: rowCells(row) }));

export interface SeatCell {
  kind: 'seat';
  row: number;
  column: number;
  accessible: boolean;
}

export interface CouchCell {
  kind: 'couch';
  row: number;
  start: number;
  end: number;
}

export type Cell = SeatCell | CouchCell;

export type Segment =
  | { type: 'entrance' }
  | { type: 'aisle' }
  | { type: 'block'; cells: Cell[] };

export interface RowLayout {
  row: number;
  segments: Segment[];
}

const ROWS = 15;
const COUCH_ROW = 15;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function firstColumn(cell: Cell): number {
  return cell.kind === 'seat' ? cell.column : cell.start;
}

export function compareCells(a: Cell, b: Cell): number {
  return a.row - b.row || firstColumn(a) - firstColumn(b);
}

export function cellKey(cell: Cell): string {
  return cell.kind === 'seat' ? seatId(cell.row, cell.column) : `${seatId(cell.row, cell.start)}-${cell.end}`;
}

export function cellIds(cell: Cell): string[] {
  return cell.kind === 'seat'
    ? [seatId(cell.row, cell.column)]
    : [seatId(cell.row, cell.start), seatId(cell.row, cell.end)];
}

function cellsBetween(row: number, from: number, to: number): Cell[] {
  const cells: Cell[] = [];
  if (row === COUCH_ROW) {
    for (let column = from; column <= to; column += 2) {
      cells.push({ kind: 'couch', row, start: column, end: column + 1 });
    }
  } else {
    for (let column = from; column <= to; column++) {
      cells.push({ kind: 'seat', row, column, accessible: row === 1 && column >= 10 && column <= 15 });
    }
  }
  return cells;
}

function buildRow(row: number): RowLayout {
  const left: Segment = row <= 10 ? { type: 'entrance' } : { type: 'block', cells: cellsBetween(row, 1, 4) };
  return {
    row,
    segments: [
      left,
      { type: 'aisle' },
      { type: 'block', cells: cellsBetween(row, 5, 20) },
      { type: 'aisle' },
      { type: 'block', cells: cellsBetween(row, 21, 24) },
    ],
  };
}

export const AUDITORIUM: RowLayout[] = Array.from({ length: ROWS }, (_, i) => buildRow(i + 1));

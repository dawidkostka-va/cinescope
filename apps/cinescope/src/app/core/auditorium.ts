const ROW_COUNT = 15;
const COUCH_ROW = 15;
const LAST_ROW_WITHOUT_LEFT_BLOCK = 10;
const ACCESSIBLE_ROW = 1;
const ACCESSIBLE_FROM = 10;
const ACCESSIBLE_TO = 15;

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

export interface AuditoriumRow {
  row: number;
  left: Cell[] | null;
  middle: Cell[];
  right: Cell[];
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function cellIds(cell: Cell): string[] {
  return cell.kind === 'seat'
    ? [seatId(cell.row, cell.column)]
    : [seatId(cell.row, cell.start), seatId(cell.row, cell.end)];
}

export function cellStartColumn(cell: Cell): number {
  return cell.kind === 'seat' ? cell.column : cell.start;
}

export function cellLabel(cell: Cell): string {
  return cell.kind === 'seat' ? `${cell.column}` : `${cell.start}-${cell.end}`;
}

export function compareCells(a: Cell, b: Cell): number {
  return a.row - b.row || cellStartColumn(a) - cellStartColumn(b);
}

function cellsBetween(row: number, from: number, to: number): Cell[] {
  const cells: Cell[] = [];
  if (row === COUCH_ROW) {
    for (let start = from; start <= to; start += 2) {
      cells.push({ kind: 'couch', row, start, end: start + 1 });
    }
    return cells;
  }
  for (let column = from; column <= to; column++) {
    const accessible = row === ACCESSIBLE_ROW && column >= ACCESSIBLE_FROM && column <= ACCESSIBLE_TO;
    cells.push({ kind: 'seat', row, column, accessible });
  }
  return cells;
}

export const AUDITORIUM: AuditoriumRow[] = Array.from({ length: ROW_COUNT }, (_, index) => {
  const row = index + 1;
  return {
    row,
    left: row > LAST_ROW_WITHOUT_LEFT_BLOCK ? cellsBetween(row, 1, 4) : null,
    middle: cellsBetween(row, 5, 20),
    right: cellsBetween(row, 21, 24),
  };
});

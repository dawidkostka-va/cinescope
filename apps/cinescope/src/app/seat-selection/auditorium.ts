export interface SeatCell {
  kind: 'seat';
  row: number;
  column: number;
  accessible: boolean;
}

export interface CouchCell {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
}

export interface AisleCell {
  kind: 'aisle';
}

export interface EntranceCell {
  kind: 'entrance';
}

export type AuditoriumCell = SeatCell | CouchCell | AisleCell | EntranceCell;

export interface AuditoriumRow {
  row: number;
  cells: AuditoriumCell[];
}

const ROW_COUNT = 15;
const COUCH_ROW = 15;
const ENTRANCE_LAST_ROW = 10;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function buildAuditorium(): AuditoriumRow[] {
  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const row = index + 1;
    const cells: AuditoriumCell[] = [];
    if (row <= ENTRANCE_LAST_ROW) {
      cells.push({ kind: 'entrance' });
    } else {
      cells.push(...span(row, 1, 4));
    }
    cells.push({ kind: 'aisle' }, ...span(row, 5, 20), { kind: 'aisle' }, ...span(row, 21, 24));
    return { row, cells };
  });
}

function span(row: number, from: number, to: number): AuditoriumCell[] {
  const cells: AuditoriumCell[] = [];
  for (let column = from; column <= to;) {
    if (row === COUCH_ROW) {
      cells.push({ kind: 'couch', row, columnStart: column, columnEnd: column + 1 });
      column += 2;
    } else {
      cells.push({
        kind: 'seat',
        row,
        column,
        accessible: row === 1 && column >= 10 && column <= 15,
      });
      column += 1;
    }
  }
  return cells;
}

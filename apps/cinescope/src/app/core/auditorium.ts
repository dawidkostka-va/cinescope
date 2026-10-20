import { seatId } from './seat-utils';

export type CellState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatCellView {
  kind: 'seat';
  row: number;
  column: number;
  state: CellState;
}

export interface CouchCellView {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  state: CellState;
}

export interface GapCellView {
  kind: 'entrance' | 'aisle';
}

export type CellView = SeatCellView | CouchCellView | GapCellView;

export interface RowView {
  row: number;
  cells: CellView[];
}

const ACCESSIBLE_COLUMNS = new Set([10, 11, 12, 13, 14, 15]);
const TOTAL_ROWS = 15;
const COUCH_ROW = 15;

function seatState(row: number, column: number, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): CellState {
  const id = seatId(row, column);
  if (selected.has(id)) return 'selected';
  if (occupied.has(id)) return 'unavailable';
  if (row === 1 && ACCESSIBLE_COLUMNS.has(column)) return 'accessible';
  return 'available';
}

function couchState(row: number, start: number, end: number, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): CellState {
  const idA = seatId(row, start);
  const idB = seatId(row, end);
  if (selected.has(idA) || selected.has(idB)) return 'selected';
  if (occupied.has(idA) || occupied.has(idB)) return 'unavailable';
  return 'available';
}

function seatCell(row: number, column: number, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): SeatCellView {
  return { kind: 'seat', row, column, state: seatState(row, column, occupied, selected) };
}

function couchCell(row: number, start: number, end: number, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): CouchCellView {
  return { kind: 'couch', row, columnStart: start, columnEnd: end, state: couchState(row, start, end, occupied, selected) };
}

export function buildAuditorium(occupied: ReadonlySet<string>, selected: ReadonlySet<string>): RowView[] {
  const rows: RowView[] = [];
  for (let row = 1; row <= TOTAL_ROWS; row++) {
    const cells: CellView[] = [];
    const isCouchRow = row === COUCH_ROW;
    const hasLeftBlock = row >= 11;

    if (hasLeftBlock) {
      if (isCouchRow) {
        cells.push(couchCell(row, 1, 2, occupied, selected));
        cells.push(couchCell(row, 3, 4, occupied, selected));
      } else {
        for (let c = 1; c <= 4; c++) cells.push(seatCell(row, c, occupied, selected));
      }
    } else {
      cells.push({ kind: 'entrance' });
    }

    cells.push({ kind: 'aisle' });

    if (isCouchRow) {
      for (let c = 5; c <= 19; c += 2) cells.push(couchCell(row, c, c + 1, occupied, selected));
    } else {
      for (let c = 5; c <= 20; c++) cells.push(seatCell(row, c, occupied, selected));
    }

    cells.push({ kind: 'aisle' });

    if (isCouchRow) {
      cells.push(couchCell(row, 21, 22, occupied, selected));
      cells.push(couchCell(row, 23, 24, occupied, selected));
    } else {
      for (let c = 21; c <= 24; c++) cells.push(seatCell(row, c, occupied, selected));
    }

    rows.push({ row, cells });
  }
  return rows;
}

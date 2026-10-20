export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMNS = [10, 11, 12, 13, 14, 15];
const AISLE_BEFORE_COLUMNS = [5, 21];

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

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

export interface EmptyCell {
  kind: 'empty';
}

export type RowCell = SeatCell | CouchCell | AisleCell | EmptyCell;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && ACCESSIBLE_COLUMNS.includes(column);
}

/** Builds the ordered cells of one row: seats, couches, aisles and the entrance gap. */
export function buildRowCells(row: number): RowCell[] {
  const cells: RowCell[] = [];
  const isCouchRow = row === COUCH_ROW;
  const isEntranceRow = row >= 1 && row <= 10;

  let column = 1;
  while (column <= COLUMN_COUNT) {
    if (AISLE_BEFORE_COLUMNS.includes(column)) {
      cells.push({ kind: 'aisle' });
    }
    if (isCouchRow) {
      cells.push({ kind: 'couch', row, columnStart: column, columnEnd: column + 1 });
      column += 2;
      continue;
    }
    if (isEntranceRow && column <= 4) {
      cells.push({ kind: 'empty' });
      column += 1;
      continue;
    }
    cells.push({ kind: 'seat', row, column, accessible: isAccessibleSeat(row, column) });
    column += 1;
  }
  return cells;
}

export function getSeatIdsForCell(cell: SeatCell | CouchCell): string[] {
  if (cell.kind === 'seat') {
    return [seatId(cell.row, cell.column)];
  }
  return [seatId(cell.row, cell.columnStart), seatId(cell.row, cell.columnEnd)];
}

export function getCellState(
  ids: string[],
  selected: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  accessible: boolean,
): SeatState {
  if (ids.some((id) => occupied.has(id))) {
    return 'unavailable';
  }
  if (ids.some((id) => selected.has(id))) {
    return 'selected';
  }
  return accessible ? 'accessible' : 'available';
}

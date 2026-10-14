import { COUCH_ROW, isAccessibleSeat, seatId, SeatState } from './seat.model';

export const TOTAL_ROWS = 15;
export const TOTAL_COLUMNS = 24;

export const LABEL_LEFT_TRACK = 1;
export const AISLE_1_TRACK = 6;
export const AISLE_2_TRACK = 23;
export const LABEL_RIGHT_TRACK = 28;

export function trackForColumn(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

export interface SeatCellVm {
  kind: 'seat';
  row: number;
  column: number;
  track: number;
  state: SeatState;
  id: string;
}

export interface CouchCellVm {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  trackStart: number;
  trackEnd: number;
  state: SeatState;
  ids: [string, string];
}

export type AuditoriumCellVm = SeatCellVm | CouchCellVm;

export interface AuditoriumRowVm {
  row: number;
  cells: AuditoriumCellVm[];
}

function columnsForRow(row: number): number[] {
  const start = row <= 10 ? 5 : 1;
  const columns: number[] = [];
  for (let column = start; column <= TOTAL_COLUMNS; column++) {
    columns.push(column);
  }
  return columns;
}

function seatState(id: string, accessible: boolean, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): SeatState {
  if (occupied.has(id)) return 'unavailable';
  if (selected.has(id)) return 'selected';
  return accessible ? 'accessible' : 'available';
}

function couchState(idA: string, idB: string, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): SeatState {
  if (occupied.has(idA) || occupied.has(idB)) return 'unavailable';
  if (selected.has(idA) || selected.has(idB)) return 'selected';
  return 'available';
}

export function generateAuditorium(occupied: ReadonlySet<string>, selected: ReadonlySet<string>): AuditoriumRowVm[] {
  const rows: AuditoriumRowVm[] = [];

  for (let row = 1; row <= TOTAL_ROWS; row++) {
    const cells: AuditoriumCellVm[] = [];

    if (row === COUCH_ROW) {
      for (let columnStart = 1; columnStart <= TOTAL_COLUMNS; columnStart += 2) {
        const columnEnd = columnStart + 1;
        const idA = seatId(row, columnStart);
        const idB = seatId(row, columnEnd);
        cells.push({
          kind: 'couch',
          row,
          columnStart,
          columnEnd,
          trackStart: trackForColumn(columnStart),
          trackEnd: trackForColumn(columnEnd),
          state: couchState(idA, idB, occupied, selected),
          ids: [idA, idB],
        });
      }
    } else {
      for (const column of columnsForRow(row)) {
        const accessible = isAccessibleSeat(row, column);
        const id = seatId(row, column);
        cells.push({
          kind: 'seat',
          row,
          column,
          track: trackForColumn(column),
          state: seatState(id, accessible, occupied, selected),
          id,
        });
      }
    }

    rows.push({ row, cells });
  }

  return rows;
}

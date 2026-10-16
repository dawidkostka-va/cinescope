import { COUCH_PRICE, SeatState, isAccessible, seatId, seatPrice } from './seat-utils';

export interface SeatCellVm {
  kind: 'seat';
  row: number;
  column: number;
  track: number;
  state: SeatState;
  price: number;
}

export interface CouchCellVm {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  track: number;
  state: SeatState;
  price: number;
}

export type AuditoriumCell = SeatCellVm | CouchCellVm;

export interface AuditoriumRow {
  row: number;
  cells: AuditoriumCell[];
}

/** Grid column track for a given seat column, see seat-row.component.scss for the template. */
function columnTrack(column: number): number {
  if (column <= 4) {
    return column + 1;
  }
  if (column <= 20) {
    return column + 2;
  }
  return column + 3;
}

function cellState(ids: string[], isSeat: boolean, row: number, column: number, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): SeatState {
  if (ids.some((id) => occupied.has(id))) {
    return 'unavailable';
  }
  if (ids.every((id) => selected.has(id))) {
    return 'selected';
  }
  if (isSeat && isAccessible(row, column)) {
    return 'accessible';
  }
  return 'available';
}

export function buildAuditorium(occupied: ReadonlySet<string>, selected: ReadonlySet<string>): AuditoriumRow[] {
  const rows: AuditoriumRow[] = [];
  for (let row = 1; row <= 15; row++) {
    const cells: AuditoriumCell[] = [];
    if (row === 15) {
      for (let start = 1; start <= 24; start += 2) {
        const end = start + 1;
        const ids = [seatId(row, start), seatId(row, end)];
        cells.push({
          kind: 'couch',
          row,
          columnStart: start,
          columnEnd: end,
          track: columnTrack(start),
          state: cellState(ids, false, row, start, occupied, selected),
          price: COUCH_PRICE,
        });
      }
    } else {
      const columns = row <= 10 ? range(5, 20).concat(range(21, 24)) : range(1, 24);
      for (const column of columns) {
        const id = seatId(row, column);
        cells.push({
          kind: 'seat',
          row,
          column,
          track: columnTrack(column),
          state: cellState([id], true, row, column, occupied, selected),
          price: seatPrice(row),
        });
      }
    }
    rows.push({ row, cells });
  }
  return rows;
}

function range(from: number, to: number): number[] {
  const result: number[] = [];
  for (let i = from; i <= to; i++) {
    result.push(i);
  }
  return result;
}

import { seatId } from '../booking/units';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatItem {
  kind: 'seat';
  row: number;
  column: number;
  state: SeatState;
}

export interface CouchItem {
  kind: 'couch';
  row: number;
  start: number;
  end: number;
  state: SeatState;
}

export type RowItem = SeatItem | CouchItem | { kind: 'aisle'; row: number } | { kind: 'entrance' };

export interface AuditoriumRow {
  row: number;
  items: RowItem[];
}

interface Occupancy {
  occupied: ReadonlySet<string>;
  selected: ReadonlySet<string>;
}

const LAST_ROW = 15;
const COUCH_ROW = 15;
const ENTRANCE_LAST_ROW = 10;
const ACCESSIBLE_ROW = 1;
const ACCESSIBLE_FROM = 10;
const ACCESSIBLE_TO = 15;

export function buildAuditorium(
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): AuditoriumRow[] {
  const occupancy: Occupancy = { occupied, selected };
  const rows: AuditoriumRow[] = [];
  for (let row = 1; row <= LAST_ROW; row++) {
    const items: RowItem[] = [];
    if (row <= ENTRANCE_LAST_ROW) {
      items.push({ kind: 'entrance' });
    } else {
      items.push(...rowBlock(row, 1, 4, occupancy));
    }
    items.push({ kind: 'aisle', row });
    items.push(...rowBlock(row, 5, 20, occupancy));
    items.push({ kind: 'aisle', row });
    items.push(...rowBlock(row, 21, 24, occupancy));
    rows.push({ row, items });
  }
  return rows;
}

function rowBlock(row: number, from: number, to: number, occupancy: Occupancy): RowItem[] {
  const items: RowItem[] = [];
  if (row === COUCH_ROW) {
    for (let column = from; column <= to; column += 2) {
      items.push({
        kind: 'couch',
        row,
        start: column,
        end: column + 1,
        state: couchState(row, column, occupancy),
      });
    }
    return items;
  }
  for (let column = from; column <= to; column++) {
    items.push({ kind: 'seat', row, column, state: seatState(row, column, occupancy) });
  }
  return items;
}

function seatState(row: number, column: number, { occupied, selected }: Occupancy): SeatState {
  const id = seatId(row, column);
  if (occupied.has(id)) {
    return 'unavailable';
  }
  if (selected.has(id)) {
    return 'selected';
  }
  const accessible = row === ACCESSIBLE_ROW && column >= ACCESSIBLE_FROM && column <= ACCESSIBLE_TO;
  return accessible ? 'accessible' : 'available';
}

function couchState(row: number, column: number, { occupied, selected }: Occupancy): SeatState {
  const ids = [seatId(row, column), seatId(row, column + 1)];
  if (ids.some((id) => occupied.has(id))) {
    return 'unavailable';
  }
  return ids.some((id) => selected.has(id)) ? 'selected' : 'available';
}

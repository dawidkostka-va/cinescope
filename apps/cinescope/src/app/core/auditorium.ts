export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatItem {
  kind: 'seat';
  row: number;
  column: number;
  ids: string[];
  state: SeatState;
}

export interface CouchItem {
  kind: 'couch';
  row: number;
  start: number;
  end: number;
  ids: string[];
  state: SeatState;
}

export interface AisleItem {
  kind: 'aisle';
  row: number;
}

export interface EntranceItem {
  kind: 'entrance';
}

export type LayoutItem = SeatItem | CouchItem | AisleItem | EntranceItem;

export interface AuditoriumRow {
  number: number;
  items: LayoutItem[];
}

const ROWS = 15;
const COLUMNS = 24;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function buildAuditorium(occupied: ReadonlySet<string>, selected: ReadonlySet<string>): AuditoriumRow[] {
  return Array.from({ length: ROWS }, (_, index) => ({
    number: index + 1,
    items: buildRow(index + 1, occupied, selected),
  }));
}

function buildRow(row: number, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): LayoutItem[] {
  const items: LayoutItem[] = [];
  if (row <= 10) {
    items.push({ kind: 'entrance' });
  }
  for (let column = 1; column <= COLUMNS; column++) {
    if (column === 5 || column === 21) {
      items.push({ kind: 'aisle', row });
    }
    if (row <= 10 && column < 5) {
      continue;
    }
    if (row === ROWS) {
      const ids = [seatId(row, column), seatId(row, column + 1)];
      items.push({ kind: 'couch', row, start: column, end: column + 1, ids, state: stateOf(ids, false, occupied, selected) });
      column++;
    } else {
      const ids = [seatId(row, column)];
      const accessible = row === 1 && column >= 10 && column <= 15;
      items.push({ kind: 'seat', row, column, ids, state: stateOf(ids, accessible, occupied, selected) });
    }
  }
  return items;
}

function stateOf(
  ids: string[],
  accessible: boolean,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  if (ids.some((id) => occupied.has(id))) {
    return 'unavailable';
  }
  if (ids.some((id) => selected.has(id))) {
    return 'selected';
  }
  return accessible ? 'accessible' : 'available';
}

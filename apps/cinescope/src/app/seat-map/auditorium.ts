export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatItem {
  kind: 'seat';
  row: number;
  column: number;
  id: string;
  state: SeatState;
}

export interface CouchItem {
  kind: 'couch';
  row: number;
  startColumn: number;
  endColumn: number;
  ids: [string, string];
  state: SeatState;
}

export interface AisleItem {
  kind: 'aisle';
  row: number;
}

export interface EntranceItem {
  kind: 'entrance';
}

export type RowItem = SeatItem | CouchItem | AisleItem | EntranceItem;

export interface AuditoriumRow {
  row: number;
  items: RowItem[];
}

const ROWS = 15;
const COUCH_ROW = 15;
const ENTRANCE_LAST_ROW = 10;
const BLOCKS: readonly [first: number, last: number][] = [
  [1, 4],
  [5, 20],
  [21, 24],
];

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function buildAuditorium(occupied: ReadonlySet<string>): AuditoriumRow[] {
  return Array.from({ length: ROWS }, (_, index) => {
    const row = index + 1;
    const items: RowItem[] = [];

    BLOCKS.forEach(([first, last], blockIndex) => {
      if (blockIndex > 0) {
        items.push({ kind: 'aisle', row });
      }
      if (row <= ENTRANCE_LAST_ROW && blockIndex === 0) {
        items.push({ kind: 'entrance' });
        return;
      }
      for (let column = first; column <= last; column++) {
        if (row === COUCH_ROW) {
          if (column % 2 === 1) {
            items.push(couch(row, column, occupied));
          }
        } else {
          items.push(seat(row, column, occupied));
        }
      }
    });

    return { row, items };
  });
}

function seat(row: number, column: number, occupied: ReadonlySet<string>): SeatItem {
  const id = seatId(row, column);
  const state: SeatState = occupied.has(id)
    ? 'unavailable'
    : isAccessible(row, column)
      ? 'accessible'
      : 'available';
  return { kind: 'seat', row, column, id, state };
}

function couch(row: number, startColumn: number, occupied: ReadonlySet<string>): CouchItem {
  const ids: [string, string] = [seatId(row, startColumn), seatId(row, startColumn + 1)];
  const state: SeatState = ids.some((id) => occupied.has(id)) ? 'unavailable' : 'available';
  return { kind: 'couch', row, startColumn, endColumn: startColumn + 1, ids, state };
}

function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

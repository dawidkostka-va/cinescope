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

export type AuditoriumItem = SeatItem | CouchItem;

/** One row of the auditorium: the three blocks between the two aisles, left to right. */
export interface AuditoriumRow {
  number: number;
  blocks: AuditoriumItem[][];
}

const ROW_COUNT = 15;
const COUCH_ROW = 15;
/** Rows 1 to 10 have no seats in columns 1 to 4: the entrance. */
const ENTRANCE_LAST_ROW = 10;
const ACCESSIBLE_ROW = 1;
const ACCESSIBLE_FIRST_COLUMN = 10;
const ACCESSIBLE_LAST_COLUMN = 15;

export function seatIdentifier(row: number, column: number): string {
  return `R${row}C${column}`;
}

/** The seat identifiers an item occupies: one for a seat, two for a couch. */
export function identifiersOf(item: AuditoriumItem): string[] {
  return item.kind === 'seat'
    ? [seatIdentifier(item.row, item.column)]
    : [seatIdentifier(item.row, item.start), seatIdentifier(item.row, item.end)];
}

/** The seat description used in the selected-seats panel: the column, or `<a>-<b>` for a couch. */
export function seatLabel(item: AuditoriumItem): string {
  return item.kind === 'seat' ? String(item.column) : `${item.start}-${item.end}`;
}

/**
 * Builds the auditorium: rows 1 to 15, each split into blocks of columns 1–4, 5–20 and 21–24.
 * An item is unavailable when any of its identifiers is occupied, selected when all of its
 * identifiers are in `selectedSeats`.
 */
export function buildAuditorium(
  occupiedSeats: ReadonlySet<string>,
  selectedSeats: ReadonlySet<string>,
): AuditoriumRow[] {
  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const number = index + 1;
    const left = number <= ENTRANCE_LAST_ROW ? [] : itemsFor(number, 1, 4, occupiedSeats, selectedSeats);
    return {
      number,
      blocks: [
        left,
        itemsFor(number, 5, 20, occupiedSeats, selectedSeats),
        itemsFor(number, 21, 24, occupiedSeats, selectedSeats),
      ],
    };
  });
}

function itemsFor(
  row: number,
  firstColumn: number,
  lastColumn: number,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): AuditoriumItem[] {
  const items: AuditoriumItem[] = [];
  if (row === COUCH_ROW) {
    for (let start = firstColumn; start <= lastColumn; start += 2) {
      const end = start + 1;
      const state = stateOf([seatIdentifier(row, start), seatIdentifier(row, end)], false, occupied, selected);
      items.push({ kind: 'couch', row, start, end, state });
    }
    return items;
  }
  for (let column = firstColumn; column <= lastColumn; column++) {
    const isAccessible =
      row === ACCESSIBLE_ROW && column >= ACCESSIBLE_FIRST_COLUMN && column <= ACCESSIBLE_LAST_COLUMN;
    const state = stateOf([seatIdentifier(row, column)], isAccessible, occupied, selected);
    items.push({ kind: 'seat', row, column, state });
  }
  return items;
}

function stateOf(
  identifiers: readonly string[],
  accessible: boolean,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  if (identifiers.some((id) => occupied.has(id))) {
    return 'unavailable';
  }
  if (identifiers.every((id) => selected.has(id))) {
    return 'selected';
  }
  return accessible ? 'accessible' : 'available';
}

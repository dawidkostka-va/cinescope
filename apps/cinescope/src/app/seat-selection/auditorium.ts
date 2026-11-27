export type SeatState = 'available' | 'unavailable' | 'accessible';

export interface SeatCell {
  kind: 'seat';
  row: number;
  column: number;
  state: SeatState;
}

export interface CouchCell {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  state: 'available' | 'unavailable';
}

export interface AisleCell {
  kind: 'aisle';
  row: number;
}

/** The space left of the seats in rows 1–10, where the entrance is. */
export interface EntranceCell {
  kind: 'entrance';
}

export type AuditoriumCell = SeatCell | CouchCell | AisleCell | EntranceCell;

export interface AuditoriumRow {
  row: number;
  cells: AuditoriumCell[];
}

const ROW_COUNT = 15;
const LAST_ENTRANCE_ROW = 10;
export const COUCH_ROW = 15;
const ACCESSIBLE_ROW = 1;
const ACCESSIBLE_FIRST_COLUMN = 10;
const ACCESSIBLE_LAST_COLUMN = 15;

/**
 * Builds the auditorium from top (row 1, next to the screen) to bottom. Each row lists its
 * cells from left to right: the left block (columns 1–4, or the entrance in rows 1–10), an
 * aisle, columns 5–20, an aisle and columns 21–24. Row 15 is made of couches.
 */
export function buildAuditorium(occupiedSeats: readonly string[]): AuditoriumRow[] {
  const occupied = new Set(occupiedSeats);
  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const row = index + 1;
    const left: AuditoriumCell[] =
      row <= LAST_ENTRANCE_ROW ? [{ kind: 'entrance' }] : blockCells(row, 1, 4, occupied);
    return {
      row,
      cells: [
        ...left,
        { kind: 'aisle', row },
        ...blockCells(row, 5, 20, occupied),
        { kind: 'aisle', row },
        ...blockCells(row, 21, 24, occupied),
      ],
    };
  });
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

/** The seat identifiers a seat or couch occupies: one for a seat, two for a couch. */
export function seatIdsOf(cell: SeatCell | CouchCell): string[] {
  return cell.kind === 'seat'
    ? [seatId(cell.row, cell.column)]
    : [seatId(cell.row, cell.columnStart), seatId(cell.row, cell.columnEnd)];
}

function blockCells(
  row: number,
  firstColumn: number,
  lastColumn: number,
  occupied: ReadonlySet<string>,
): AuditoriumCell[] {
  const cells: AuditoriumCell[] = [];
  for (let column = firstColumn; column <= lastColumn;) {
    if (row === COUCH_ROW) {
      cells.push(couchCell(row, column, occupied));
      column += 2;
    } else {
      cells.push(seatCell(row, column, occupied));
      column += 1;
    }
  }
  return cells;
}

function seatCell(row: number, column: number, occupied: ReadonlySet<string>): SeatCell {
  let state: SeatState = 'available';
  if (occupied.has(seatId(row, column))) {
    state = 'unavailable';
  } else if (isAccessible(row, column)) {
    state = 'accessible';
  }
  return { kind: 'seat', row, column, state };
}

function couchCell(row: number, columnStart: number, occupied: ReadonlySet<string>): CouchCell {
  const columnEnd = columnStart + 1;
  const isOccupied = occupied.has(seatId(row, columnStart)) || occupied.has(seatId(row, columnEnd));
  return {
    kind: 'couch',
    row,
    columnStart,
    columnEnd,
    state: isOccupied ? 'unavailable' : 'available',
  };
}

function isAccessible(row: number, column: number): boolean {
  return (
    row === ACCESSIBLE_ROW && column >= ACCESSIBLE_FIRST_COLUMN && column <= ACCESSIBLE_LAST_COLUMN
  );
}

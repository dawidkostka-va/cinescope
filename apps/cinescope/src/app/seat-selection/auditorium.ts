/** Seat state as drawn on the map. */
export type SeatState = 'available' | 'accessible' | 'selected' | 'unavailable';

/** A couch is never accessible. */
export type CouchState = Exclude<SeatState, 'accessible'>;

export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;

/** Rows 1 to 10 have no seats in columns 1 to 4: that space is the entrance. */
const ENTRANCE_LAST_ROW = 10;
export const COUCH_ROW = 15;
const ACCESSIBLE_ROW = 1;
const ACCESSIBLE_FIRST_COLUMN = 10;
const ACCESSIBLE_LAST_COLUMN = 15;

/**
 * The auditorium is a CSS grid with 28 tracks per row: track 1 is the left row label, tracks
 * 2–5 are columns 1–4, track 6 is the left aisle, tracks 7–22 are columns 5–20, track 23 is the
 * right aisle, tracks 24–27 are columns 21–24 and track 28 is the right row label.
 */
const LEFT_AISLE_TRACK = 6;
const RIGHT_AISLE_TRACK = 23;

interface CellBase {
  row: number;
  /** CSS `grid-column` value, e.g. `2 / 3`. */
  gridColumn: string;
}

export interface SeatCell extends CellBase {
  kind: 'seat';
  column: number;
  state: SeatState;
}

export interface CouchCell extends CellBase {
  kind: 'couch';
  columnStart: number;
  columnEnd: number;
  state: CouchState;
}

export interface AisleCell extends CellBase {
  kind: 'aisle';
}

export type AuditoriumCell = SeatCell | CouchCell | AisleCell;

export interface AuditoriumRow {
  row: number;
  cells: AuditoriumCell[];
}

/** Grid track holding the given seat column. */
function columnTrack(column: number): number {
  if (column <= 4) {
    return column + 1;
  }
  if (column <= 20) {
    return column + 2;
  }
  return column + 3;
}

/** `grid-column` value covering the tracks of columns `first` to `last` (inclusive). */
function columnSpan(first: number, last: number): string {
  return `${columnTrack(first)} / ${columnTrack(last) + 1}`;
}

function trackSpan(track: number): string {
  return `${track} / ${track + 1}`;
}

/** Seat identifiers (`R<row>C<column>`) covered by a seat or couch; a couch covers two. */
export function seatIdsOf(cell: SeatCell | CouchCell): string[] {
  if (cell.kind === 'seat') {
    return [seatId(cell.row, cell.column)];
  }
  return [seatId(cell.row, cell.columnStart), seatId(cell.row, cell.columnEnd)];
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

/**
 * Builds the 15 rows of the auditorium from the occupied seat identifiers (`R<row>C<column>`)
 * and the selected ones. Couches in row 15 are built as one cell per pair of columns (1–2,
 * 3–4, … 23–24).
 */
export function buildAuditorium(
  occupiedSeats: readonly string[],
  selectedSeats: ReadonlySet<string> = new Set(),
): AuditoriumRow[] {
  const occupied = new Set(occupiedSeats);
  const isOccupied = (row: number, column: number) => occupied.has(seatId(row, column));
  const isSelected = (row: number, column: number) => selectedSeats.has(seatId(row, column));

  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const row = index + 1;
    const cells: AuditoriumCell[] = [
      { kind: 'aisle', row, gridColumn: trackSpan(LEFT_AISLE_TRACK) },
      { kind: 'aisle', row, gridColumn: trackSpan(RIGHT_AISLE_TRACK) },
    ];

    for (let column = 1; column <= COLUMN_COUNT; column++) {
      if (row <= ENTRANCE_LAST_ROW && column <= 4) {
        continue;
      }

      if (row === COUCH_ROW) {
        if (column % 2 === 1) {
          cells.push({
            kind: 'couch',
            row,
            columnStart: column,
            columnEnd: column + 1,
            gridColumn: columnSpan(column, column + 1),
            state: couchState(
              isOccupied(row, column) || isOccupied(row, column + 1),
              isSelected(row, column) || isSelected(row, column + 1),
            ),
          });
        }
        continue;
      }

      cells.push({
        kind: 'seat',
        row,
        column,
        gridColumn: columnSpan(column, column),
        state: seatState(row, column, isOccupied(row, column), isSelected(row, column)),
      });
    }

    return { row, cells };
  });
}

function couchState(occupied: boolean, selected: boolean): CouchState {
  if (occupied) {
    return 'unavailable';
  }
  return selected ? 'selected' : 'available';
}

function seatState(row: number, column: number, occupied: boolean, selected: boolean): SeatState {
  if (occupied) {
    return 'unavailable';
  }
  if (selected) {
    return 'selected';
  }
  const accessible =
    row === ACCESSIBLE_ROW && column >= ACCESSIBLE_FIRST_COLUMN && column <= ACCESSIBLE_LAST_COLUMN;
  return accessible ? 'accessible' : 'available';
}

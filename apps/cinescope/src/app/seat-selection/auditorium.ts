export type SeatState = 'available' | 'unavailable' | 'accessible';

/** A seat, or a couch covering two adjacent columns of row 15. */
export interface SeatCell {
  kind: 'seat' | 'couch';
  row: number;
  /** The column of a seat, or the left column of a couch. */
  column: number;
  /** Equal to `column` for a seat, `column + 1` for a couch. */
  columnEnd: number;
  state: SeatState;
}

/**
 * One piece of a row, left to right. `entrance` is the empty space on the left of rows 1–10,
 * `aisle` is an empty gap, `block` holds the seats or couches of one block of columns.
 */
export type RowSegment = { kind: 'entrance' } | { kind: 'aisle' } | { kind: 'block'; cells: SeatCell[] };

export interface AuditoriumRow {
  number: number;
  segments: RowSegment[];
}

export const ROW_COUNT = 15;
const COUCH_ROW = 15;
const ENTRANCE_LAST_ROW = 10;

/** Seat identifier as stored in `occupiedSeats`, e.g. `R7C12`. */
export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

/** Builds the auditorium: 15 rows, each split into the left, middle and right blocks. */
export function buildAuditorium(occupiedSeats: readonly string[]): AuditoriumRow[] {
  const occupied = new Set(occupiedSeats);

  const seat = (row: number, column: number): SeatCell => {
    const accessible = row === 1 && column >= 10 && column <= 15;
    let state: SeatState = 'available';
    if (occupied.has(seatId(row, column))) {
      state = 'unavailable';
    } else if (accessible) {
      state = 'accessible';
    }
    return { kind: 'seat', row, column, columnEnd: column, state };
  };

  const couch = (row: number, column: number): SeatCell => {
    const unavailable = occupied.has(seatId(row, column)) || occupied.has(seatId(row, column + 1));
    return {
      kind: 'couch',
      row,
      column,
      columnEnd: column + 1,
      state: unavailable ? 'unavailable' : 'available',
    };
  };

  /** Cells for the columns from `first` to `last` (inclusive). Row 15 holds couches instead of seats. */
  const cellsBetween = (row: number, first: number, last: number): SeatCell[] => {
    const cells: SeatCell[] = [];
    if (row === COUCH_ROW) {
      for (let column = first; column <= last; column += 2) {
        cells.push(couch(row, column));
      }
    } else {
      for (let column = first; column <= last; column++) {
        cells.push(seat(row, column));
      }
    }
    return cells;
  };

  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const number = index + 1;
    const leftSegment: RowSegment =
      number <= ENTRANCE_LAST_ROW
        ? { kind: 'entrance' }
        : { kind: 'block', cells: cellsBetween(number, 1, 4) };

    return {
      number,
      segments: [
        leftSegment,
        { kind: 'aisle' },
        { kind: 'block', cells: cellsBetween(number, 5, 20) },
        { kind: 'aisle' },
        { kind: 'block', cells: cellsBetween(number, 21, 24) },
      ],
    };
  });
}

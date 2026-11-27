export type SeatState = 'available' | 'unavailable' | 'accessible';

/**
 * One element of a row: a seat, a couch, or an empty gap (`aisle` or `entrance`).
 * Gaps carry no columns and no state.
 */
export interface AuditoriumCell {
  type: 'seat' | 'couch' | 'aisle' | 'entrance';
  /** First column covered by the cell; 0 for gaps. */
  start: number;
  /** Last column covered by the cell; equal to `start` for a seat, `start + 1` for a couch. */
  end: number;
  /** Seat or couch state; null for gaps. A couch is never `accessible`. */
  state: SeatState | null;
}

export interface AuditoriumRow {
  number: number;
  cells: AuditoriumCell[];
}

const ROW_COUNT = 15;
const COUCH_ROW = 15;
const LAST_ENTRANCE_ROW = 10;
const ACCESSIBLE_ROW = 1;
const ACCESSIBLE_FIRST_COLUMN = 10;
const ACCESSIBLE_LAST_COLUMN = 15;

/**
 * Builds the 15 rows of the auditorium. Every row is made of the same blocks — columns 1–4,
 * an aisle, columns 5–20, an aisle, columns 21–24 — so columns line up across rows. In rows
 * 1–10 the first block is replaced by an empty entrance of the same width.
 *
 * @param occupied seat identifiers (`R<row>C<column>`) that are already sold
 */
export function buildAuditorium(occupied: ReadonlySet<string>): AuditoriumRow[] {
  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const row = index + 1;
    const cells: AuditoriumCell[] = [
      ...(row <= LAST_ENTRANCE_ROW ? [gap('entrance')] : block(row, 1, 4, occupied)),
      gap('aisle'),
      ...block(row, 5, 20, occupied),
      gap('aisle'),
      ...block(row, 21, 24, occupied),
    ];
    return { number: row, cells };
  });
}

function gap(type: 'aisle' | 'entrance'): AuditoriumCell {
  return { type, start: 0, end: 0, state: null };
}

/** Seats of a block in a regular row; couches of a block in the couch row. */
function block(row: number, first: number, last: number, occupied: ReadonlySet<string>): AuditoriumCell[] {
  const cells: AuditoriumCell[] = [];
  if (row === COUCH_ROW) {
    for (let column = first; column <= last; column += 2) {
      const sold = occupied.has(seatId(row, column)) || occupied.has(seatId(row, column + 1));
      cells.push({ type: 'couch', start: column, end: column + 1, state: sold ? 'unavailable' : 'available' });
    }
  } else {
    for (let column = first; column <= last; column++) {
      cells.push({ type: 'seat', start: column, end: column, state: seatState(row, column, occupied) });
    }
  }
  return cells;
}

function seatState(row: number, column: number, occupied: ReadonlySet<string>): SeatState {
  if (occupied.has(seatId(row, column))) {
    return 'unavailable';
  }
  const accessible =
    row === ACCESSIBLE_ROW && column >= ACCESSIBLE_FIRST_COLUMN && column <= ACCESSIBLE_LAST_COLUMN;
  return accessible ? 'accessible' : 'available';
}

function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

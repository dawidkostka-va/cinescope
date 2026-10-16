export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function isCouchRow(row: number): boolean {
  return row === COUCH_ROW;
}

/** For a couch row, the [start, end] column pair covering the given column. */
export function couchRange(column: number): [number, number] {
  const start = column % 2 === 1 ? column : column - 1;
  return [start, start + 1];
}

export function couchSeatIds(row: number, startColumn: number): [string, string] {
  return [seatId(row, startColumn), seatId(row, startColumn + 1)];
}

/** Whether a column exists on the given row (false in the entrance gap of rows 1-10). */
export function columnExistsOnRow(row: number, column: number): boolean {
  if (row >= 11) {
    return true;
  }
  return column >= 5 && column <= COLUMN_COUNT;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  throw new Error(`Row ${row} has no per-seat price (couch row)`);
}

export const COUCH_PRICE = 89;

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export interface SelectionUnit {
  row: number;
  /** Single seat column, or the lower column of a couch pair. */
  startColumn: number;
  endColumn?: number;
  seatIds: string[];
  price: number;
}

/** Groups a flat list of seat identifiers into seats and couches for display. */
export function toSelectionUnits(seatIds: string[]): SelectionUnit[] {
  const ids = new Set(seatIds);
  const seen = new Set<string>();
  const units: SelectionUnit[] = [];

  for (const id of seatIds) {
    if (seen.has(id)) continue;
    const { row, column } = parseSeatId(id);
    if (isCouchRow(row)) {
      const [start, end] = couchRange(column);
      const pairIds = couchSeatIds(row, start);
      seen.add(pairIds[0]);
      seen.add(pairIds[1]);
      units.push({
        row,
        startColumn: start,
        endColumn: end,
        seatIds: pairIds.filter((pid) => ids.has(pid)),
        price: COUCH_PRICE,
      });
    } else {
      seen.add(id);
      units.push({
        row,
        startColumn: column,
        seatIds: [id],
        price: priceForRow(row),
      });
    }
  }

  return units.sort((a, b) => a.row - b.row || a.startColumn - b.startColumn);
}

export function computeSeatState(
  id: string,
  occupiedSeats: ReadonlySet<string>,
  selectedSeats: ReadonlySet<string>,
  accessible: boolean,
): SeatState {
  if (occupiedSeats.has(id)) return 'unavailable';
  if (selectedSeats.has(id)) return 'selected';
  if (accessible) return 'accessible';
  return 'available';
}

export function computeCouchState(
  ids: [string, string],
  occupiedSeats: ReadonlySet<string>,
  selectedSeats: ReadonlySet<string>,
): 'available' | 'selected' | 'unavailable' {
  if (ids.some((id) => occupiedSeats.has(id))) return 'unavailable';
  if (ids.some((id) => selectedSeats.has(id))) return 'selected';
  return 'available';
}

export function countSeats(seatIds: string[]): number {
  return seatIds.length;
}

export function totalPrice(seatIds: string[]): number {
  return toSelectionUnits(seatIds).reduce((sum, unit) => sum + unit.price, 0);
}

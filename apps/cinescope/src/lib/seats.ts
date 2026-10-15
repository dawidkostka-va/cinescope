export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const MAX_SEATS_PER_BOOKING = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const SEAT_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function isCouchRow(row: number): boolean {
  return row === COUCH_ROW;
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  return 89;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

/**
 * Maps a seat column (1-24) to a CSS grid track, leaving room for the row labels and the
 * two aisles so every row shares the same template and columns line up across rows.
 * Tracks: 1 = left label, 2-5 = columns 1-4, 6 = aisle, 7-22 = columns 5-20, 23 = aisle,
 * 24-27 = columns 21-24, 28 = right label.
 */
export function seatColumnTrack(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

export const LEFT_LABEL_TRACK = 1;
export const AISLE_TRACK_1 = 6;
export const AISLE_TRACK_2 = 23;
export const RIGHT_LABEL_TRACK = 28;
export const GRID_TRACK_COUNT = 28;

/** Couch pairs in row 15: [1,2], [3,4], ... [23,24]. */
export function couchPairs(): [number, number][] {
  const pairs: [number, number][] = [];
  for (let c = 1; c <= COLUMN_COUNT; c += 2) {
    pairs.push([c, c + 1]);
  }
  return pairs;
}

export type RowCell =
  | { kind: 'seat'; column: number }
  | { kind: 'couch'; columnStart: number; columnEnd: number };

/** All seat/couch cells of a row, left to right. Rows 1-10 omit columns 1-4 (the entrance). */
export function buildRowCells(row: number): RowCell[] {
  if (isCouchRow(row)) {
    return couchPairs().map(([a, b]) => ({ kind: 'couch', columnStart: a, columnEnd: b }));
  }
  const startColumn = row <= 10 ? 5 : 1;
  const cells: RowCell[] = [];
  for (let c = startColumn; c <= COLUMN_COUNT; c += 1) cells.push({ kind: 'seat', column: c });
  return cells;
}

export function seatState(
  row: number,
  column: number,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  if (isCouchRow(row)) {
    const pair = couchPairs().find(([a]) => a === column || a + 1 === column);
    const [a, b] = pair ?? [column, column];
    const idA = seatId(row, a);
    const idB = seatId(row, b);
    if (occupied.has(idA) || occupied.has(idB)) return 'unavailable';
    if (selected.has(idA) || selected.has(idB)) return 'selected';
    return 'available';
  }
  const id = seatId(row, column);
  if (occupied.has(id)) return 'unavailable';
  if (selected.has(id)) return 'selected';
  if (isAccessible(row, column)) return 'accessible';
  return 'available';
}

export interface SummaryItem {
  row: number;
  columnStart: number;
  columnEnd: number | null;
  identifiers: string[];
  price: number;
}

/** Groups a flat list of selected seat identifiers into seats/couches, ordered by row then column. */
export function toSummaryItems(seats: string[]): SummaryItem[] {
  const seatSet = new Set(seats);
  const items: SummaryItem[] = [];
  const consumed = new Set<string>();

  const byRow = new Map<number, number[]>();
  for (const id of seats) {
    const match = /^R(\d+)C(\d+)$/.exec(id);
    if (!match) continue;
    const row = Number(match[1]);
    const column = Number(match[2]);
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row)?.push(column);
  }

  const rows = Array.from(byRow.keys()).sort((a, b) => a - b);
  for (const row of rows) {
    const columns = (byRow.get(row) ?? []).slice().sort((a, b) => a - b);
    if (isCouchRow(row)) {
      for (const [a, b] of couchPairs()) {
        const idA = seatId(row, a);
        const idB = seatId(row, b);
        if (seatSet.has(idA) && !consumed.has(idA)) {
          consumed.add(idA);
          consumed.add(idB);
          items.push({
            row,
            columnStart: a,
            columnEnd: b,
            identifiers: [idA, idB],
            price: priceForRow(row),
          });
        }
      }
    } else {
      for (const column of columns) {
        const id = seatId(row, column);
        if (consumed.has(id)) continue;
        consumed.add(id);
        items.push({
          row,
          columnStart: column,
          columnEnd: null,
          identifiers: [id],
          price: priceForRow(row),
        });
      }
    }
  }

  return items;
}

export function seatLabel(item: SummaryItem): string {
  return item.columnEnd !== null ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`;
}

/** A seat is its column number; a couch is `<a>-<b>` (no `Couch` prefix, unlike the summary screen). */
function panelSeatLabel(item: SummaryItem): string {
  return item.columnEnd !== null ? `${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`;
}

/** `Selected seats: n` count plus one `Row r: seats` line per row with a selection. */
export function selectedSeatsByRow(seats: string[]): { row: number; label: string }[] {
  const items = toSummaryItems(seats);
  const byRow = new Map<number, string[]>();
  for (const item of items) {
    if (!byRow.has(item.row)) byRow.set(item.row, []);
    byRow.get(item.row)?.push(panelSeatLabel(item));
  }
  const rows = Array.from(byRow.keys()).sort((a, b) => a - b);
  return rows.map((row) => ({ row, label: (byRow.get(row) ?? []).join(', ') }));
}

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const TOTAL_ROWS = 15;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMNS: readonly number[] = [10, 11, 12, 13, 14, 15];
export const MAX_SEATS_PER_BOOKING = 10;
export const COUCH_PRICE = 89;

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

export function isAccessible(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && ACCESSIBLE_COLUMNS.includes(column);
}

/** The 12 couch column pairs of row 15: [1,2], [3,4] … [23,24]. */
export function couchPairs(): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let start = 1; start <= 23; start += 2) {
    pairs.push([start, start + 1]);
  }
  return pairs;
}

export function couchPairFor(column: number): [number, number] {
  const start = column % 2 === 1 ? column : column - 1;
  return [start, start + 1];
}

export function seatPrice(row: number): number {
  if (row >= 1 && row <= 5) return 25;
  if (row >= 6 && row <= 10) return 32;
  if (row >= 11 && row <= 14) return 39;
  throw new Error(`Row ${row} has no single-seat price`);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export function seatState(
  id: string,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
  accessible: boolean,
): SeatState {
  if (selected.has(id)) return 'selected';
  if (occupied.has(id)) return 'unavailable';
  return accessible ? 'accessible' : 'available';
}

export function couchState(
  id1: string,
  id2: string,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  if (selected.has(id1) || selected.has(id2)) return 'selected';
  if (occupied.has(id1) || occupied.has(id2)) return 'unavailable';
  return 'available';
}

export interface SummaryEntry {
  row: number;
  kind: 'seat' | 'couch';
  seatLabel: string;
  identifiers: string[];
  price: number;
}

/** Groups raw seat identifiers into seat/couch entries, ordered by row then column. */
export function buildSummaryEntries(seats: readonly string[]): SummaryEntry[] {
  const parsed = seats.map((id) => ({ id, ...parseSeatId(id) }));
  parsed.sort((a, b) => a.row - b.row || a.column - b.column);

  const seen = new Set<string>();
  const entries: SummaryEntry[] = [];

  for (const { id, row, column } of parsed) {
    if (seen.has(id)) continue;
    if (row === COUCH_ROW) {
      const [start, end] = couchPairFor(column);
      const id1 = seatId(row, start);
      const id2 = seatId(row, end);
      seen.add(id1);
      seen.add(id2);
      entries.push({
        row,
        kind: 'couch',
        seatLabel: `Couch ${start}-${end}`,
        identifiers: [id1, id2],
        price: COUCH_PRICE,
      });
    } else {
      seen.add(id);
      entries.push({
        row,
        kind: 'seat',
        seatLabel: String(column),
        identifiers: [id],
        price: seatPrice(row),
      });
    }
  }

  return entries;
}

export interface RowSelectionLine {
  row: number;
  text: string;
}

/** Groups selected seat identifiers into one display line per row, columns ascending. */
export function buildRowSelectionLines(seats: readonly string[]): RowSelectionLine[] {
  const byRow = new Map<number, { sortKey: number; text: string }[]>();
  const seenCouches = new Set<string>();

  for (const id of seats) {
    const { row, column } = parseSeatId(id);
    if (row === COUCH_ROW) {
      const [start, end] = couchPairFor(column);
      const key = `${row}:${start}`;
      if (seenCouches.has(key)) continue;
      seenCouches.add(key);
      const list = byRow.get(row) ?? [];
      list.push({ sortKey: start, text: `${start}-${end}` });
      byRow.set(row, list);
    } else {
      const list = byRow.get(row) ?? [];
      list.push({ sortKey: column, text: String(column) });
      byRow.set(row, list);
    }
  }

  return [...byRow.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, items]) => ({
      row,
      text: items
        .sort((a, b) => a.sortKey - b.sortKey)
        .map((i) => i.text)
        .join(', '),
    }));
}

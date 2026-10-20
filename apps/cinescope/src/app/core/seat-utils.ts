export interface SeatRef {
  row: number;
  column: number;
}

export type SelectionItem =
  | { type: 'seat'; row: number; column: number }
  | { type: 'couch'; row: number; columnStart: number; columnEnd: number };

const SEAT_ID_RE = /^R(\d+)C(\d+)$/;

export const COUCH_ROW = 15;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): SeatRef {
  const match = SEAT_ID_RE.exec(id);
  if (!match) throw new Error(`Invalid seat id: ${id}`);
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

/** The two column numbers of the couch that `column` belongs to, e.g. 3 or 4 -> [3, 4]. */
export function couchColumnsFor(column: number): [number, number] {
  const start = column % 2 === 1 ? column : column - 1;
  return [start, start + 1];
}

export function couchIdsFor(row: number, column: number): [string, string] {
  const [start, end] = couchColumnsFor(column);
  return [seatId(row, start), seatId(row, end)];
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const COUCH_PRICE = 89;

/** Groups a flat list of seat identifiers into seats and couches, sorted by row then column. */
export function seatsToItems(seatIds: string[]): SelectionItem[] {
  const refs = seatIds.map(parseSeatId);
  const seenCouches = new Set<number>();
  const items: SelectionItem[] = [];
  for (const ref of refs) {
    if (ref.row === COUCH_ROW) {
      const [start, end] = couchColumnsFor(ref.column);
      if (seenCouches.has(start)) continue;
      seenCouches.add(start);
      items.push({ type: 'couch', row: ref.row, columnStart: start, columnEnd: end });
    } else {
      items.push({ type: 'seat', row: ref.row, column: ref.column });
    }
  }
  items.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    const colA = a.type === 'couch' ? a.columnStart : a.column;
    const colB = b.type === 'couch' ? b.columnStart : b.column;
    return colA - colB;
  });
  return items;
}

export function priceForItem(item: SelectionItem): number {
  return item.type === 'couch' ? COUCH_PRICE : priceForRow(item.row);
}

export function totalPrice(seatIds: string[]): number {
  return seatsToItems(seatIds).reduce((sum, item) => sum + priceForItem(item), 0);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

/** Flattens selection items back to seat identifiers, a couch contributing both of its identifiers. */
export function itemsToSeatIds(items: SelectionItem[]): string[] {
  return items.flatMap((item) =>
    item.type === 'couch' ? [seatId(item.row, item.columnStart), seatId(item.row, item.columnEnd)] : [seatId(item.row, item.column)],
  );
}

/** Seat identifiers ordered by row then column, a couch contributing both of its identifiers together. */
export function orderedSeatIds(seatIds: string[]): string[] {
  return itemsToSeatIds(seatsToItems(seatIds));
}

export interface SelectedSeatsRow {
  row: number;
  text: string;
}

/** One line per row with a selection, e.g. `{ row: 15, text: '1-2' }`, rows ascending. */
export function selectedSeatsByRow(seatIds: string[]): SelectedSeatsRow[] {
  const items = seatsToItems(seatIds);
  const byRow = new Map<number, string[]>();
  for (const item of items) {
    const label = item.type === 'couch' ? `${item.columnStart}-${item.columnEnd}` : `${item.column}`;
    const labels = byRow.get(item.row) ?? [];
    labels.push(label);
    byRow.set(item.row, labels);
  }
  return [...byRow.entries()].sort((a, b) => a[0] - b[0]).map(([row, labels]) => ({ row, text: labels.join(', ') }));
}

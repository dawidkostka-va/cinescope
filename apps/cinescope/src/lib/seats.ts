export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMNS = [10, 11, 12, 13, 14, 15];
export const MAX_SEATS_PER_BOOKING = 10;
export const COUCH_PRICE = 89;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export type SeatCell = { kind: 'seat'; column: number };
export type CouchCell = { kind: 'couch'; columnStart: number; columnEnd: number };
export type RowCell = SeatCell | CouchCell;

export interface RowLayout {
  row: number;
  leftBlock: RowCell[];
  middleBlock: RowCell[];
  rightBlock: RowCell[];
}

export function hasLeftBlock(row: number): boolean {
  return row >= 11;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function couchIds(row: number, columnStart: number): [string, string] {
  return [seatId(row, columnStart), seatId(row, columnStart + 1)];
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessible(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && column >= 10 && column <= 15;
}

export function getSeatState(id: string, row: number, column: number, occupied: Set<string>, selected: Set<string>): SeatState {
  if (selected.has(id)) return 'selected';
  if (occupied.has(id)) return 'unavailable';
  if (isAccessible(row, column)) return 'accessible';
  return 'available';
}

export function getCouchState(ids: [string, string], occupied: Set<string>, selected: Set<string>): SeatState {
  if (ids.every((id) => selected.has(id))) return 'selected';
  if (ids.some((id) => occupied.has(id))) return 'unavailable';
  return 'available';
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function getRowLayout(row: number): RowLayout {
  if (row === COUCH_ROW) {
    const couches: CouchCell[] = [];
    for (let c = 1; c <= COLUMN_COUNT; c += 2) {
      couches.push({ kind: 'couch', columnStart: c, columnEnd: c + 1 });
    }
    return {
      row,
      leftBlock: couches.filter((c) => c.columnStart <= 4),
      middleBlock: couches.filter((c) => c.columnStart >= 5 && c.columnEnd <= 20),
      rightBlock: couches.filter((c) => c.columnStart >= 21),
    };
  }

  const leftBlock: SeatCell[] = hasLeftBlock(row) ? [1, 2, 3, 4].map((column) => ({ kind: 'seat', column })) : [];
  const middleBlock: SeatCell[] = [];
  for (let c = 5; c <= 20; c++) middleBlock.push({ kind: 'seat', column: c });
  const rightBlock: SeatCell[] = [21, 22, 23, 24].map((column) => ({ kind: 'seat', column }));

  return { row, leftBlock, middleBlock, rightBlock };
}

/** Toggles a single (non-couch) seat. Returns null when selecting it would exceed the cap. */
export function toggleSeatSelection(selected: string[], id: string): string[] | null {
  if (selected.includes(id)) {
    return selected.filter((s) => s !== id);
  }
  if (selected.length + 1 > MAX_SEATS_PER_BOOKING) {
    return null;
  }
  return [...selected, id];
}

/** Toggles a couch (its two identifiers) as one unit. Returns null when selecting it would exceed the cap. */
export function toggleCouchSelection(selected: string[], ids: [string, string]): string[] | null {
  const bothSelected = ids.every((id) => selected.includes(id));
  if (bothSelected) {
    return selected.filter((s) => !ids.includes(s));
  }
  if (selected.length + 2 > MAX_SEATS_PER_BOOKING) {
    return null;
  }
  return [...selected, ...ids];
}

export interface BookingItem {
  row: number;
  kind: 'seat' | 'couch';
  column?: number;
  columnStart?: number;
  columnEnd?: number;
  ids: string[];
  price: number;
}

/** Groups the flat seat-identifier selection into display/summary items, ordered by row then column. */
export function buildBookingItems(selectedIds: string[]): BookingItem[] {
  const byRow = new Map<number, number[]>();
  for (const id of selectedIds) {
    const { row, column } = parseSeatId(id);
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row)?.push(column);
  }

  const items: BookingItem[] = [];
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  for (const row of rows) {
    const columns = (byRow.get(row) ?? []).slice().sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      for (let i = 0; i < columns.length; i += 2) {
        const a = columns[i];
        const b = columns[i + 1];
        items.push({
          row,
          kind: 'couch',
          columnStart: a,
          columnEnd: b,
          ids: [seatId(row, a), seatId(row, b)],
          price: COUCH_PRICE,
        });
      }
    } else {
      for (const column of columns) {
        items.push({
          row,
          kind: 'seat',
          column,
          ids: [seatId(row, column)],
          price: priceForRow(row),
        });
      }
    }
  }
  return items;
}

export function summarizeByRow(items: BookingItem[]): Array<{ row: number; label: string }> {
  const byRow = new Map<number, string[]>();
  for (const item of items) {
    const label = item.kind === 'couch' ? `${item.columnStart}-${item.columnEnd}` : `${item.column}`;
    if (!byRow.has(item.row)) byRow.set(item.row, []);
    byRow.get(item.row)?.push(label);
  }
  return [...byRow.keys()]
    .sort((a, b) => a - b)
    .map((row) => ({ row, label: (byRow.get(row) ?? []).join(', ') }));
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

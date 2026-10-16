export const TOTAL_ROWS = 15;
export const TOTAL_COLUMNS = 24;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMNS = [10, 11, 12, 13, 14, 15];
export const MAX_SEATS_PER_BOOKING = 10;
export const COUCH_PRICE = 89;

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

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function hasLeftBlock(row: number): boolean {
  return row >= 11;
}

export function rowColumns(row: number): number[] {
  const start = hasLeftBlock(row) ? 1 : 5;
  const columns: number[] = [];
  for (let column = start; column <= TOTAL_COLUMNS; column++) {
    columns.push(column);
  }
  return columns;
}

export function isAccessible(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && ACCESSIBLE_COLUMNS.includes(column);
}

export function isCouchRow(row: number): boolean {
  return row === COUCH_ROW;
}

export function couchPairs(): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let start = 1; start < TOTAL_COLUMNS; start += 2) {
    pairs.push([start, start + 1]);
  }
  return pairs;
}

export function getRowPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function getSeatState(
  row: number,
  column: number,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  const id = seatId(row, column);
  if (occupied.has(id)) return 'unavailable';
  if (selected.has(id)) return 'selected';
  if (isAccessible(row, column)) return 'accessible';
  return 'available';
}

export function getCouchState(
  ids: readonly [string, string],
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): Exclude<SeatState, 'accessible'> {
  if (ids.some((id) => occupied.has(id))) return 'unavailable';
  if (ids.every((id) => selected.has(id))) return 'selected';
  return 'available';
}

export function gridColumnStart(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

export type SelectionItem =
  | { type: 'seat'; row: number; column: number }
  | { type: 'couch'; row: number; columnStart: number; columnEnd: number };

export function getSelectionItems(seatIds: readonly string[]): SelectionItem[] {
  const byRow = new Map<number, number[]>();
  for (const id of seatIds) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }

  const items: SelectionItem[] = [];
  for (const [row, columns] of byRow) {
    if (isCouchRow(row)) {
      const seen = new Set<number>();
      for (const column of [...columns].sort((a, b) => a - b)) {
        if (seen.has(column)) continue;
        const start = column % 2 === 1 ? column : column - 1;
        const end = start + 1;
        seen.add(start);
        seen.add(end);
        items.push({ type: 'couch', row, columnStart: start, columnEnd: end });
      }
    } else {
      for (const column of [...columns].sort((a, b) => a - b)) {
        items.push({ type: 'seat', row, column });
      }
    }
  }

  items.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    const startA = a.type === 'seat' ? a.column : a.columnStart;
    const startB = b.type === 'seat' ? b.column : b.columnStart;
    return startA - startB;
  });

  return items;
}

export function getItemPrice(item: SelectionItem): number {
  if (item.type === 'couch') return COUCH_PRICE;
  return getRowPrice(item.row);
}

export function getItemSeatIds(item: SelectionItem): string[] {
  if (item.type === 'couch') {
    return [seatId(item.row, item.columnStart), seatId(item.row, item.columnEnd)];
  }
  return [seatId(item.row, item.column)];
}

export function getOrderedSeatIds(seatIds: readonly string[]): string[] {
  return getSelectionItems(seatIds).flatMap(getItemSeatIds);
}

export function getTotalPrice(seatIds: readonly string[]): number {
  return getSelectionItems(seatIds).reduce((sum, item) => sum + getItemPrice(item), 0);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

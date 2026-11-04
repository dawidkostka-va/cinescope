import { SeatItem } from './models';

export const ROWS = 15;
export const COLUMNS = 24;
export const MAX_SEATS = 10;
export const COUCH_ROW = 15;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface BlockLayout {
  /** false for the entrance gap in rows 1-10 */
  exists: boolean;
  cells: SeatItem[];
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function itemIds(item: SeatItem): string[] {
  const ids: string[] = [];
  for (let c = item.start; c <= item.end; c++) ids.push(seatId(item.row, c));
  return ids;
}

export function itemSize(item: SeatItem): number {
  return item.end - item.start + 1;
}

export function isCouch(item: SeatItem): boolean {
  return item.row === COUCH_ROW;
}

export function isAccessible(item: SeatItem): boolean {
  return item.row === 1 && item.start >= 10 && item.end <= 15;
}

export function sameItem(a: SeatItem, b: SeatItem): boolean {
  return a.row === b.row && a.start === b.start && a.end === b.end;
}

export function compareItems(a: SeatItem, b: SeatItem): number {
  return a.row - b.row || a.start - b.start;
}

export function priceOf(item: SeatItem): number {
  if (isCouch(item)) return 89;
  if (item.row <= 5) return 25;
  if (item.row <= 10) return 32;
  return 39;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function itemLabel(item: SeatItem): string {
  return item.start === item.end ? `${item.start}` : `${item.start}-${item.end}`;
}

export function seatCount(items: SeatItem[]): number {
  return items.reduce((sum, i) => sum + itemSize(i), 0);
}

export function totalPrice(items: SeatItem[]): number {
  return items.reduce((sum, i) => sum + priceOf(i), 0);
}

export function itemState(
  item: SeatItem,
  selected: SeatItem[],
  occupied: ReadonlySet<string>,
): SeatState {
  if (itemIds(item).some((id) => occupied.has(id))) return 'unavailable';
  if (selected.some((s) => sameItem(s, item))) return 'selected';
  if (isAccessible(item)) return 'accessible';
  return 'available';
}

function cellsFor(row: number, from: number, to: number): SeatItem[] {
  const cells: SeatItem[] = [];
  if (row === COUCH_ROW) {
    for (let c = from; c < to; c += 2) cells.push({ row, start: c, end: c + 1 });
  } else {
    for (let c = from; c <= to; c++) cells.push({ row, start: c, end: c });
  }
  return cells;
}

/** Three blocks per row: columns 1-4, 5-20, 21-24. */
export function rowLayout(row: number): BlockLayout[] {
  return [
    { exists: row > 10, cells: row > 10 ? cellsFor(row, 1, 4) : [] },
    { exists: true, cells: cellsFor(row, 5, 20) },
    { exists: true, cells: cellsFor(row, 21, 24) },
  ];
}

export function sortedItems(items: SeatItem[]): SeatItem[] {
  return [...items].sort(compareItems);
}

export function itemsToSeatIds(items: SeatItem[]): string[] {
  return sortedItems(items).flatMap(itemIds);
}

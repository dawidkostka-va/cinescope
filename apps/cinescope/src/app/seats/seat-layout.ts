export const ROWS = 15;
export const COLUMNS = 24;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export interface SeatItem {
  row: number;
  /** Column of a seat, or the first column of a couch. */
  column: number;
}

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const isCouch = (item: SeatItem): boolean => item.row === COUCH_ROW;

export const seatCount = (item: SeatItem): number => (isCouch(item) ? 2 : 1);

export const lastColumn = (item: SeatItem): number => item.column + seatCount(item) - 1;

export const seatId = (row: number, column: number): string => `R${row}C${column}`;

export const itemIds = (item: SeatItem): string[] =>
  isCouch(item)
    ? [seatId(item.row, item.column), seatId(item.row, item.column + 1)]
    : [seatId(item.row, item.column)];

export const sameItem = (a: SeatItem, b: SeatItem): boolean =>
  a.row === b.row && a.column === b.column;

export const compareItems = (a: SeatItem, b: SeatItem): number =>
  a.row - b.row || a.column - b.column;

export const isAccessible = (item: SeatItem): boolean =>
  item.row === 1 && item.column >= 10 && item.column <= 15;

export function itemPrice(item: SeatItem): number {
  if (isCouch(item)) return 89;
  if (item.row <= 5) return 25;
  if (item.row <= 10) return 32;
  return 39;
}

export const formatPrice = (amount: number): string => `${amount.toFixed(2)} PLN`;

export const itemLabel = (item: SeatItem): string =>
  isCouch(item) ? `${item.column}-${lastColumn(item)}` : String(item.column);

/** Columns that exist in a block of the given row; the entrance block (1-4) is missing in rows 1-10. */
export function rowBlocks(row: number): { entrance: boolean; blocks: SeatItem[][] } {
  const couch = row === COUCH_ROW;
  const range = (from: number, to: number): SeatItem[] => {
    const items: SeatItem[] = [];
    for (let column = from; column <= to; column += couch ? 2 : 1) {
      items.push({ row, column });
    }
    return items;
  };
  const entrance = row <= 10;
  return {
    entrance,
    blocks: [entrance ? [] : range(1, 4), range(5, 20), range(21, 24)],
  };
}

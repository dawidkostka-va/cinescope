export const MAX_SEATS = 10;
export const ROW_COUNT = 15;
export const COUCH_ROW = 15;

export interface SeatItem {
  key: string;
  row: number;
  colStart: number;
  colEnd: number;
  couch: boolean;
  price: number;
}

export const seatId = (row: number, column: number) => `R${row}C${column}`;

export function priceOf(row: number): number {
  if (row === COUCH_ROW) return 89;
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function seatCountOf(key: string): number {
  return parseKey(key).row === COUCH_ROW ? 2 : 1;
}

export function parseKey(key: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(key);
  return { row: Number(match?.[1]), column: Number(match?.[2]) };
}

export function buildItems(keys: string[]): SeatItem[] {
  return keys
    .map((key) => {
      const { row, column } = parseKey(key);
      const couch = row === COUCH_ROW;
      return { key, row, colStart: column, colEnd: couch ? column + 1 : column, couch, price: priceOf(row) };
    })
    .sort((a, b) => a.row - b.row || a.colStart - b.colStart);
}

export function reservationSeats(items: SeatItem[]): string[] {
  return items.flatMap((item) =>
    item.couch ? [seatId(item.row, item.colStart), seatId(item.row, item.colEnd)] : [item.key],
  );
}

export function describeSeat(item: SeatItem): string {
  return item.couch ? `${item.colStart}-${item.colEnd}` : String(item.colStart);
}

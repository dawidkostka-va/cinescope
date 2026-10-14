export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const COUCH_ROW = 15;
export const MAX_SEATS_PER_BOOKING = 10;

export interface ParsedSeat {
  row: number;
  column: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): ParsedSeat {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function couchColumnStart(column: number): number {
  return column % 2 === 0 ? column - 1 : column;
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

export interface BookingItem {
  row: number;
  columnStart: number;
  columnEnd: number | null;
  isCouch: boolean;
  price: number;
  ids: string[];
}

/** Groups flat seat identifiers into seats/couches, ordered by row then column. */
export function toBookingItems(seatIds: string[]): BookingItem[] {
  const items: BookingItem[] = [];
  const seen = new Set<string>();

  const parsed = seatIds.map((id) => ({ id, ...parseSeatId(id) }));

  for (const seat of parsed) {
    if (seen.has(seat.id)) continue;

    if (seat.row === COUCH_ROW) {
      const start = couchColumnStart(seat.column);
      const idA = seatId(seat.row, start);
      const idB = seatId(seat.row, start + 1);
      seen.add(idA);
      seen.add(idB);
      items.push({
        row: seat.row,
        columnStart: start,
        columnEnd: start + 1,
        isCouch: true,
        price: priceForRow(seat.row),
        ids: [idA, idB],
      });
    } else {
      seen.add(seat.id);
      items.push({
        row: seat.row,
        columnStart: seat.column,
        columnEnd: null,
        isCouch: false,
        price: priceForRow(seat.row),
        ids: [seat.id],
      });
    }
  }

  items.sort((a, b) => a.row - b.row || a.columnStart - b.columnStart);
  return items;
}

export function seatCount(seatIds: string[]): number {
  return seatIds.length;
}

export function totalPrice(items: BookingItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function flattenItemIds(items: BookingItem[]): string[] {
  return items.flatMap((item) => item.ids);
}

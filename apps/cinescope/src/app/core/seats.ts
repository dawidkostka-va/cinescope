export const TOTAL_ROWS = 15;
export const TOTAL_COLUMNS = 24;
export const MAX_SEATS_PER_BOOKING = 10;
export const COUCH_ROW = 15;
export const COUCH_PRICE = 89;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) throw new Error(`Invalid seat id: ${id}`);
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export interface BookingItem {
  row: number;
  kind: 'seat' | 'couch';
  column?: number;
  columnStart?: number;
  columnEnd?: number;
  price: number;
  ids: string[];
}

/** Groups selected seat identifiers into seats/couches, ordered by row then column. */
export function groupBookingSeats(ids: string[]): BookingItem[] {
  const byRow = new Map<number, number[]>();
  for (const id of ids) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row);
    if (columns) columns.push(column);
    else byRow.set(row, [column]);
  }

  const items: BookingItem[] = [];
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  for (const row of rows) {
    const columns = [...byRow.get(row)!].sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      for (let i = 0; i < columns.length; i += 2) {
        const start = columns[i];
        const end = columns[i + 1];
        items.push({
          row,
          kind: 'couch',
          columnStart: start,
          columnEnd: end,
          price: COUCH_PRICE,
          ids: [seatId(row, start), seatId(row, end)],
        });
      }
    } else {
      for (const column of columns) {
        items.push({
          row,
          kind: 'seat',
          column,
          price: seatPrice(row),
          ids: [seatId(row, column)],
        });
      }
    }
  }
  return items;
}

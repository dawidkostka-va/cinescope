export const ROWS = 15;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface TicketItem {
  row: number;
  columnStart: number;
  columnEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } | null {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  return match ? { row: Number(match[1]), column: Number(match[2]) } : null;
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const COUCH_PRICE = 89;

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function itemsFromSeats(seats: string[]): TicketItem[] {
  const items = new Map<string, TicketItem>();
  for (const id of seats) {
    const parsed = parseSeatId(id);
    if (!parsed) continue;
    const { row, column } = parsed;
    if (row === COUCH_ROW) {
      const start = column % 2 === 1 ? column : column - 1;
      const key = `${row}-${start}`;
      if (!items.has(key)) {
        items.set(key, {
          row,
          columnStart: start,
          columnEnd: start + 1,
          couch: true,
          ids: [seatId(row, start), seatId(row, start + 1)],
          price: COUCH_PRICE,
        });
      }
    } else {
      items.set(`${row}-${column}`, {
        row,
        columnStart: column,
        columnEnd: column,
        couch: false,
        ids: [id],
        price: seatPrice(row),
      });
    }
  }
  return [...items.values()].sort((a, b) => a.row - b.row || a.columnStart - b.columnStart);
}

export function seatsFromItems(items: TicketItem[]): string[] {
  return items.flatMap((item) => item.ids);
}

export function itemLabel(item: TicketItem): string {
  return item.couch ? `${item.columnStart}-${item.columnEnd}` : String(item.columnStart);
}

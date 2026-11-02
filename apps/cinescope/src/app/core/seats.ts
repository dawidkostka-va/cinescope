export const MAX_SEATS = 10;
export const ROWS = 15;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_FROM = 10;
export const ACCESSIBLE_TO = 15;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface TicketItem {
  row: number;
  columnStart: number;
  columnEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export const seatId = (row: number, column: number) => `R${row}C${column}`;

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  return { row: Number(match?.[1]), column: Number(match?.[2]) };
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

export function isAccessible(row: number, column: number): boolean {
  return row === ACCESSIBLE_ROW && column >= ACCESSIBLE_FROM && column <= ACCESSIBLE_TO;
}

export function buildTickets(seats: string[]): TicketItem[] {
  const items = new Map<string, TicketItem>();
  for (const id of seats) {
    const { row, column } = parseSeatId(id);
    if (row === COUCH_ROW) {
      const start = column % 2 === 1 ? column : column - 1;
      const key = seatId(row, start);
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
      items.set(id, { row, columnStart: column, columnEnd: column, couch: false, ids: [id], price: seatPrice(row) });
    }
  }
  return [...items.values()].sort((a, b) => a.row - b.row || a.columnStart - b.columnStart);
}

export function describeTicket(item: TicketItem): string {
  return item.couch ? `${item.columnStart}-${item.columnEnd}` : String(item.columnStart);
}

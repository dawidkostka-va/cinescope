export const ROW_COUNT = 15;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface Ticket {
  row: number;
  start: number;
  end: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export const seatId = (row: number, column: number) => `R${row}C${column}`;

export function parseSeatId(id: string): { row: number; column: number } | null {
  const m = /^R(\d+)C(\d+)$/.exec(id);
  return m ? { row: Number(m[1]), column: Number(m[2]) } : null;
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function priceOf(row: number, couch: boolean): number {
  if (couch) return 89;
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function couchTicket(row: number, start: number): Ticket {
  return {
    row,
    start,
    end: start + 1,
    couch: true,
    ids: [seatId(row, start), seatId(row, start + 1)],
    price: priceOf(row, true),
  };
}

export function seatTicket(row: number, column: number): Ticket {
  return { row, start: column, end: column, couch: false, ids: [seatId(row, column)], price: priceOf(row, false) };
}

export function ticketsFromSeats(ids: readonly string[]): Ticket[] {
  const map = new Map<string, Ticket>();
  for (const id of ids) {
    const parsed = parseSeatId(id);
    if (!parsed) continue;
    const { row, column } = parsed;
    const ticket =
      row === COUCH_ROW ? couchTicket(row, column - ((column - 1) % 2)) : seatTicket(row, column);
    map.set(`${ticket.row}-${ticket.start}`, ticket);
  }
  return [...map.values()].sort((a, b) => a.row - b.row || a.start - b.start);
}

export function seatDescription(ticket: Ticket): string {
  return ticket.couch ? `Couch ${ticket.start}-${ticket.end}` : String(ticket.start);
}

export function gridColumn(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

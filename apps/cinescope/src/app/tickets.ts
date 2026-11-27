import { COUCH_ROW, seatId } from './seat-selection/auditorium';

/** Price of a couch in row 15, per couch (two seats), in PLN. */
export const COUCH_PRICE = 89;

/** One line of the summary: a single seat or a couch, with its price. */
export interface Ticket {
  row: number;
  /** The column number of a seat, or `Couch <a>-<b>` for a couch. */
  seat: string;
  /** The seat identifiers the ticket covers: one for a seat, two for a couch. */
  seatIds: string[];
  /** Price in PLN. */
  price: number;
}

/** Price of a single seat in the given row, in PLN. Accessible seats are in row 1. */
export function seatPrice(row: number): number {
  if (row <= 5) {
    return 25;
  }
  if (row <= 10) {
    return 32;
  }
  return 39;
}

/** Formats a price in PLN with two decimals and the suffix, e.g. `25.00 PLN`. */
export function formatPrice(pln: number): string {
  return `${pln.toFixed(2)} PLN`;
}

/** Sum of the prices of the tickets, in PLN. */
export function totalOf(tickets: readonly Ticket[]): number {
  return tickets.reduce((sum, ticket) => sum + ticket.price, 0);
}

function parseSeatId(id: string): { row: number; column: number } | null {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  return match ? { row: Number(match[1]), column: Number(match[2]) } : null;
}

/**
 * Turns seat identifiers into summary tickets, ordered by row and then by column. In the couch
 * row, each couch (columns 1–2, 3–4, …) is one ticket, so its second seat is not listed again.
 */
export function ticketsOf(seatIds: readonly string[]): Ticket[] {
  const seats = seatIds
    .map(parseSeatId)
    .filter((seat): seat is { row: number; column: number } => seat !== null)
    .sort((a, b) => a.row - b.row || a.column - b.column);

  const tickets: Ticket[] = [];
  for (const { row, column } of seats) {
    if (row === COUCH_ROW) {
      if (column % 2 === 1) {
        tickets.push({
          row,
          seat: `Couch ${column}-${column + 1}`,
          seatIds: [seatId(row, column), seatId(row, column + 1)],
          price: COUCH_PRICE,
        });
      }
      continue;
    }
    tickets.push({ row, seat: String(column), seatIds: [seatId(row, column)], price: seatPrice(row) });
  }
  return tickets;
}

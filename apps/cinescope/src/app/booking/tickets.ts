import { seatIdentifier } from '../seat-selection/auditorium';

const COUCH_ROW = 15;
const COUCH_PRICE = 89;

/** One line of the booking: a single seat, or a couch covering two adjacent columns of row 15. */
export type Ticket =
  | { kind: 'seat'; row: number; column: number }
  | { kind: 'couch'; row: number; start: number; end: number };

/** The tickets of a booking, ordered by row and then by column. */
export function ticketsFor(seats: readonly string[]): Ticket[] {
  const positions = seats
    .map((id) => {
      const [row, column] = id.slice(1).split('C').map(Number);
      return { row, column };
    })
    .sort((a, b) => a.row - b.row || a.column - b.column);

  const tickets: Ticket[] = [];
  for (const { row, column } of positions) {
    if (row !== COUCH_ROW) {
      tickets.push({ kind: 'seat', row, column });
    } else if (column % 2 === 1) {
      // Row 15 holds only couches, which start at an odd column; the second identifier of each is skipped.
      tickets.push({ kind: 'couch', row, start: column, end: column + 1 });
    }
  }
  return tickets;
}

/** The seat identifiers a ticket occupies: one for a seat, two for a couch. */
export function identifiersOfTicket(ticket: Ticket): string[] {
  return ticket.kind === 'seat'
    ? [seatIdentifier(ticket.row, ticket.column)]
    : [seatIdentifier(ticket.row, ticket.start), seatIdentifier(ticket.row, ticket.end)];
}

/** The seat description: the column of a seat, `Couch <a>-<b>` for a couch. */
export function describeTicket(ticket: Ticket): string {
  return ticket.kind === 'seat' ? String(ticket.column) : `Couch ${ticket.start}-${ticket.end}`;
}

/** The price in PLN: by row for a seat, per couch for a couch. */
export function priceOf(ticket: Ticket): number {
  if (ticket.kind === 'couch') {
    return COUCH_PRICE;
  }
  if (ticket.row <= 5) {
    return 25;
  }
  if (ticket.row <= 10) {
    return 32;
  }
  return 39;
}

/** The total price of a booking in PLN. */
export function totalOf(seats: readonly string[]): number {
  return ticketsFor(seats).reduce((sum, ticket) => sum + priceOf(ticket), 0);
}

/** Formats an amount in PLN with two decimals, e.g. `25.00 PLN`. */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

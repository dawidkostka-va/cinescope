import { COUCH_PRICE, COUCH_ROW, couchPairForColumn, parseSeatId, priceForRow, seatId } from './seatLayout';

export interface Ticket {
  row: number;
  kind: 'seat' | 'couch';
  columns: number[];
  price: number;
}

export function buildTickets(seatIds: string[]): Ticket[] {
  const parsed = seatIds.map((id) => ({ id, ...parseSeatId(id) }));
  const consumed = new Set<string>();
  const sorted = [...parsed].sort((a, b) => a.row - b.row || a.column - b.column);
  const tickets: Ticket[] = [];

  for (const entry of sorted) {
    if (consumed.has(entry.id)) continue;
    if (entry.row === COUCH_ROW) {
      const pair = couchPairForColumn(entry.column);
      consumed.add(seatId(COUCH_ROW, pair[0]));
      consumed.add(seatId(COUCH_ROW, pair[1]));
      tickets.push({ row: COUCH_ROW, kind: 'couch', columns: pair, price: COUCH_PRICE });
    } else {
      consumed.add(entry.id);
      tickets.push({ row: entry.row, kind: 'seat', columns: [entry.column], price: priceForRow(entry.row) });
    }
  }

  tickets.sort((a, b) => a.row - b.row || a.columns[0] - b.columns[0]);
  return tickets;
}

export function ticketSeatIds(ticket: Ticket): string[] {
  return ticket.columns.map((column) => seatId(ticket.row, column));
}

export function orderedSeatIds(seatIds: string[]): string[] {
  return buildTickets(seatIds).flatMap(ticketSeatIds);
}

export function totalPrice(seatIds: string[]): number {
  return buildTickets(seatIds).reduce((sum, ticket) => sum + ticket.price, 0);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

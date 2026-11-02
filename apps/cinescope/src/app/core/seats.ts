export const ROW_COUNT = 15;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;
export const COUCH_PRICE = 89;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const STATE_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

export const BLOCKS: readonly (readonly [number, number])[] = [
  [1, 4],
  [5, 20],
  [21, 24],
];

export interface Ticket {
  row: number;
  colStart: number;
  colEnd: number;
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

export function hasColumn(row: number, column: number): boolean {
  return row >= 11 || column >= 5;
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export function ticketFor(row: number, colStart: number): Ticket {
  if (row === COUCH_ROW) {
    return {
      row,
      colStart,
      colEnd: colStart + 1,
      couch: true,
      ids: [seatId(row, colStart), seatId(row, colStart + 1)],
      price: COUCH_PRICE,
    };
  }
  return {
    row,
    colStart,
    colEnd: colStart,
    couch: false,
    ids: [seatId(row, colStart)],
    price: seatPrice(row),
  };
}

export function ticketsFromSeats(ids: readonly string[]): Ticket[] {
  const tickets: Ticket[] = [];
  for (const id of ids) {
    const seat = parseSeatId(id);
    if (!seat) continue;
    if (seat.row === COUCH_ROW && seat.column % 2 === 0) continue;
    tickets.push(ticketFor(seat.row, seat.column));
  }
  return tickets.sort((a, b) => a.row - b.row || a.colStart - b.colStart);
}

export function ticketLabel(ticket: Ticket): string {
  return ticket.couch ? `${ticket.colStart}-${ticket.colEnd}` : `${ticket.colStart}`;
}

export interface RowSelection {
  row: number;
  text: string;
}

export function selectionByRow(tickets: readonly Ticket[]): RowSelection[] {
  const rows = new Map<number, string[]>();
  for (const ticket of tickets) {
    rows.set(ticket.row, [...(rows.get(ticket.row) ?? []), ticketLabel(ticket)]);
  }
  return [...rows.entries()].map(([row, labels]) => ({
    row,
    text: `Row ${row}: ${labels.join(', ')}`,
  }));
}

export interface SeatCell {
  kind: 'seat';
  row: number;
  column: number;
  state: SeatState;
  ticket: Ticket;
}

export interface CouchCell {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  state: SeatState;
  ticket: Ticket;
}

export type Cell = SeatCell | CouchCell;

export interface BlockView {
  width: number;
  cells: Cell[];
}

export interface RowView {
  row: number;
  blocks: BlockView[];
}

const SEAT_WIDTH = 32;
const SEAT_GAP = 4;

export function buildRows(occupied: ReadonlySet<string>, selected: ReadonlySet<string>): RowView[] {
  const rows: RowView[] = [];
  for (let row = 1; row <= ROW_COUNT; row++) {
    const blocks: BlockView[] = BLOCKS.map(([from, to]) => {
      const columns = to - from + 1;
      const cells: Cell[] = [];
      if (row === COUCH_ROW) {
        for (let start = from; start < to; start += 2) {
          const ticket = ticketFor(row, start);
          cells.push({
            kind: 'couch',
            row,
            columnStart: start,
            columnEnd: start + 1,
            ticket,
            state: stateOf(ticket, occupied, selected, false),
          });
        }
      } else {
        for (let column = from; column <= to; column++) {
          if (!hasColumn(row, column)) continue;
          const ticket = ticketFor(row, column);
          cells.push({
            kind: 'seat',
            row,
            column,
            ticket,
            state: stateOf(ticket, occupied, selected, isAccessible(row, column)),
          });
        }
      }
      return { width: columns * SEAT_WIDTH + (columns - 1) * SEAT_GAP, cells };
    });
    rows.push({ row, blocks });
  }
  return rows;
}

function stateOf(
  ticket: Ticket,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
  accessible: boolean,
): SeatState {
  if (ticket.ids.some((id) => occupied.has(id))) return 'unavailable';
  if (ticket.ids.every((id) => selected.has(id))) return 'selected';
  return accessible ? 'accessible' : 'available';
}

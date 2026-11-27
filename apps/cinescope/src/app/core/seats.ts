export const ROWS = 15;
export const COLUMNS = 24;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface Cell {
  kind: 'seat' | 'couch';
  row: number;
  column: number;
  columnEnd: number;
  ids: string[];
  accessible: boolean;
}

export type RowItem = { type: 'cell'; cell: Cell } | { type: 'aisle' } | { type: 'entrance' };

export interface RowLayout {
  row: number;
  items: RowItem[];
}

export const seatId = (row: number, column: number) => `R${row}C${column}`;

function cell(row: number, column: number): Cell {
  if (row === COUCH_ROW) {
    return {
      kind: 'couch',
      row,
      column,
      columnEnd: column + 1,
      ids: [seatId(row, column), seatId(row, column + 1)],
      accessible: false,
    };
  }
  return {
    kind: 'seat',
    row,
    column,
    columnEnd: column,
    ids: [seatId(row, column)],
    accessible: row === 1 && column >= 10 && column <= 15,
  };
}

function block(row: number, from: number, to: number): Cell[] {
  const step = row === COUCH_ROW ? 2 : 1;
  const cells: Cell[] = [];
  for (let column = from; column <= to; column += step) {
    cells.push(cell(row, column));
  }
  return cells;
}

export const AUDITORIUM: RowLayout[] = Array.from({ length: ROWS }, (_, i) => {
  const row = i + 1;
  const cells = (from: number, to: number): RowItem[] =>
    block(row, from, to).map((c): RowItem => ({ type: 'cell', cell: c }));
  return {
    row,
    items: [
      ...(row <= 10 ? [{ type: 'entrance' } as RowItem] : cells(1, 4)),
      { type: 'aisle' },
      ...cells(5, 20),
      { type: 'aisle' },
      ...cells(21, 24),
    ],
  };
});

export interface Ticket {
  kind: 'seat' | 'couch';
  row: number;
  column: number;
  columnEnd: number;
  ids: string[];
  price: number;
}

export function priceOf(row: number, kind: 'seat' | 'couch'): number {
  if (kind === 'couch') {
    return 89;
  }
  if (row <= 5) {
    return 25;
  }
  return row <= 10 ? 32 : 39;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function parseSeatId(id: string): { row: number; column: number } | null {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  return match ? { row: Number(match[1]), column: Number(match[2]) } : null;
}

export function ticketsOf(seatIds: readonly string[]): Ticket[] {
  const tickets = new Map<string, Ticket>();
  for (const id of seatIds) {
    const parsed = parseSeatId(id);
    if (!parsed) {
      continue;
    }
    const { row, column } = parsed;
    if (row === COUCH_ROW) {
      const start = column % 2 === 1 ? column : column - 1;
      const key = seatId(row, start);
      if (!tickets.has(key)) {
        tickets.set(key, {
          kind: 'couch',
          row,
          column: start,
          columnEnd: start + 1,
          ids: [seatId(row, start), seatId(row, start + 1)],
          price: priceOf(row, 'couch'),
        });
      }
    } else if (!tickets.has(id)) {
      tickets.set(id, { kind: 'seat', row, column, columnEnd: column, ids: [id], price: priceOf(row, 'seat') });
    }
  }
  return [...tickets.values()].sort((a, b) => a.row - b.row || a.column - b.column);
}

export const totalOf = (tickets: readonly Ticket[]) => tickets.reduce((sum, t) => sum + t.price, 0);

export function describeTicket(ticket: Ticket): string {
  return ticket.kind === 'couch' ? `${ticket.column}-${ticket.columnEnd}` : String(ticket.column);
}

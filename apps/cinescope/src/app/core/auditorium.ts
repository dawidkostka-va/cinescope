export interface Cell {
  key: string;
  kind: 'seat' | 'couch';
  row: number;
  start: number;
  end: number;
  ids: string[];
  price: number;
  accessible: boolean;
}

export interface RowLayout {
  row: number;
  entrance: boolean;
  left: Cell[];
  middle: Cell[];
  right: Cell[];
}

export interface Ticket {
  row: number;
  kind: 'seat' | 'couch';
  start: number;
  end: number;
  ids: string[];
  price: number;
}

export const MAX_SEATS = 10;
const COUCH_ROW = 15;
const COUCH_PRICE = 89;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function seatPrice(row: number): number {
  if (row <= 5) {
    return 25;
  }
  if (row <= 10) {
    return 32;
  }
  return 39;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function buildRow(row: number): RowLayout {
  const seat = (column: number): Cell => ({
    key: seatId(row, column),
    kind: 'seat',
    row,
    start: column,
    end: column,
    ids: [seatId(row, column)],
    price: seatPrice(row),
    accessible: row === 1 && column >= 10 && column <= 15,
  });
  const couch = (start: number): Cell => ({
    key: seatId(row, start),
    kind: 'couch',
    row,
    start,
    end: start + 1,
    ids: [seatId(row, start), seatId(row, start + 1)],
    price: COUCH_PRICE,
    accessible: false,
  });
  const cells = (from: number, to: number): Cell[] =>
    row === COUCH_ROW ? range(from, to).filter((column) => column % 2 === 1).map(couch) : range(from, to).map(seat);

  return {
    row,
    entrance: row <= 10,
    left: row <= 10 ? [] : cells(1, 4),
    middle: cells(5, 20),
    right: cells(21, 24),
  };
}

export const AUDITORIUM: RowLayout[] = range(1, 15).map(buildRow);

export function tickets(seats: string[]): Ticket[] {
  const ids = new Set(seats);
  const result: Ticket[] = [];
  const parsed = seats
    .map((id) => {
      const [, row, column] = /^R(\d+)C(\d+)$/.exec(id) ?? [];
      return { id, row: Number(row), column: Number(column) };
    })
    .sort((a, b) => a.row - b.row || a.column - b.column);

  for (const seat of parsed) {
    if (seat.row === COUCH_ROW && seat.column % 2 === 1 && ids.has(seatId(seat.row, seat.column + 1))) {
      result.push({
        row: seat.row,
        kind: 'couch',
        start: seat.column,
        end: seat.column + 1,
        ids: [seat.id, seatId(seat.row, seat.column + 1)],
        price: COUCH_PRICE,
      });
    } else if (!(seat.row === COUCH_ROW && seat.column % 2 === 0 && ids.has(seatId(seat.row, seat.column - 1)))) {
      result.push({ row: seat.row, kind: 'seat', start: seat.column, end: seat.column, ids: [seat.id], price: seatPrice(seat.row) });
    }
  }
  return result;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export function ticketSeatLabel(ticket: Ticket): string {
  return ticket.kind === 'couch' ? `${ticket.start}-${ticket.end}` : String(ticket.start);
}

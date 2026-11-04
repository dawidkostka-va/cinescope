export const MAX_SEATS = 10;
export const ROW_COUNT = 15;
export const COUCH_ROW = 15;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface Ticket {
  key: string;
  row: number;
  colStart: number;
  colEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export type Cell = { couch: false; col: number } | { couch: true; col: number };

export interface RowModel {
  row: number;
  cells: Cell[];
}

export const seatId = (row: number, col: number): string => `R${row}C${col}`;

export function parseSeatId(id: string): { row: number; col: number } | null {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  return match ? { row: Number(match[1]), col: Number(match[2]) } : null;
}

export function isAccessibleSeat(row: number, col: number): boolean {
  return row === 1 && col >= 10 && col <= 15;
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const COUCH_PRICE = 89;

export function formatAmount(value: number): string {
  return value.toFixed(2);
}

export function formatPrice(value: number): string {
  return `${formatAmount(value)} PLN`;
}

export function gridTrack(col: number): number {
  if (col <= 4) return col + 1;
  if (col <= 20) return col + 2;
  return col + 3;
}

export function buildRows(): RowModel[] {
  const rows: RowModel[] = [];
  for (let row = 1; row <= ROW_COUNT; row++) {
    const cells: Cell[] = [];
    if (row === COUCH_ROW) {
      for (let col = 1; col <= 23; col += 2) cells.push({ couch: true, col });
    } else {
      for (let col = row <= 10 ? 5 : 1; col <= 24; col++) cells.push({ couch: false, col });
    }
    rows.push({ row, cells });
  }
  return rows;
}

export function compareSeatIds(a: string, b: string): number {
  const pa = parseSeatId(a);
  const pb = parseSeatId(b);
  if (!pa || !pb) return a.localeCompare(b);
  return pa.row - pb.row || pa.col - pb.col;
}

export function ticketsFromSeats(ids: string[]): Ticket[] {
  const tickets = new Map<string, Ticket>();
  for (const id of [...ids].sort(compareSeatIds)) {
    const seat = parseSeatId(id);
    if (!seat) continue;
    if (seat.row === COUCH_ROW) {
      const start = seat.col % 2 === 1 ? seat.col : seat.col - 1;
      const key = `couch-${start}`;
      if (!tickets.has(key)) {
        tickets.set(key, {
          key,
          row: seat.row,
          colStart: start,
          colEnd: start + 1,
          couch: true,
          ids: [seatId(seat.row, start), seatId(seat.row, start + 1)],
          price: COUCH_PRICE,
        });
      }
    } else {
      tickets.set(id, {
        key: id,
        row: seat.row,
        colStart: seat.col,
        colEnd: seat.col,
        couch: false,
        ids: [id],
        price: seatPrice(seat.row),
      });
    }
  }
  return [...tickets.values()];
}

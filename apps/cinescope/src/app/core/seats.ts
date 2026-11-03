export const ROW_COUNT = 15;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface Cell {
  row: number;
  columnStart: number;
  columnEnd: number;
  couch: boolean;
  accessible: boolean;
  ids: string[];
}

export interface AuditoriumRow {
  row: number;
  blocks: (Cell[] | null)[];
}

export interface BookingItem {
  row: number;
  columnStart: number;
  columnEnd: number;
  couch: boolean;
  price: number;
  ids: string[];
}

const BLOCK_RANGES: [number, number][] = [
  [1, 4],
  [5, 20],
  [21, 24],
];

export const seatId = (row: number, column: number) => `R${row}C${column}`;

export function parseSeatId(id: string): { row: number; column: number } | null {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  return match ? { row: Number(match[1]), column: Number(match[2]) } : null;
}

export function priceOf(row: number, couch: boolean): number {
  if (couch) {
    return 89;
  }
  if (row <= 5) {
    return 25;
  }
  return row <= 10 ? 32 : 39;
}

export const formatPrice = (value: number) => `${value.toFixed(2)} PLN`;

function buildBlock(row: number, from: number, to: number): Cell[] {
  const cells: Cell[] = [];
  if (row === COUCH_ROW) {
    for (let column = from; column < to; column += 2) {
      cells.push({
        row,
        columnStart: column,
        columnEnd: column + 1,
        couch: true,
        accessible: false,
        ids: [seatId(row, column), seatId(row, column + 1)],
      });
    }
    return cells;
  }
  for (let column = from; column <= to; column++) {
    cells.push({
      row,
      columnStart: column,
      columnEnd: column,
      couch: false,
      accessible: row === 1 && column >= 10 && column <= 15,
      ids: [seatId(row, column)],
    });
  }
  return cells;
}

export const AUDITORIUM: AuditoriumRow[] = Array.from({ length: ROW_COUNT }, (_, index) => {
  const row = index + 1;
  return {
    row,
    blocks: BLOCK_RANGES.map(([from, to], block) => (block === 0 && row <= 10 ? null : buildBlock(row, from, to))),
  };
});

export function bookingItems(seatIds: string[]): BookingItem[] {
  const parsed = seatIds
    .flatMap((id) => {
      const seat = parseSeatId(id);
      return seat ? [{ id, ...seat }] : [];
    })
    .sort((a, b) => a.row - b.row || a.column - b.column);

  const items: BookingItem[] = [];
  for (const seat of parsed) {
    if (seat.row === COUCH_ROW) {
      const start = seat.column % 2 === 0 ? seat.column - 1 : seat.column;
      const last = items[items.length - 1];
      if (last && last.couch && last.row === seat.row && last.columnStart === start) {
        continue;
      }
      items.push({
        row: seat.row,
        columnStart: start,
        columnEnd: start + 1,
        couch: true,
        price: priceOf(seat.row, true),
        ids: [seatId(seat.row, start), seatId(seat.row, start + 1)],
      });
    } else if (!items.some((item) => item.ids[0] === seat.id)) {
      items.push({
        row: seat.row,
        columnStart: seat.column,
        columnEnd: seat.column,
        couch: false,
        price: priceOf(seat.row, false),
        ids: [seat.id],
      });
    }
  }
  return items;
}

export const itemLabel = (item: BookingItem) => (item.couch ? `${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`);

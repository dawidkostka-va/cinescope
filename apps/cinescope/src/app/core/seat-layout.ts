export const ROW_COUNT = 15;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export interface SeatItem {
  key: string;
  row: number;
  colStart: number;
  colEnd: number;
  couch: boolean;
  accessible: boolean;
  ids: string[];
  price: number;
}

export interface AuditoriumRow {
  row: number;
  entrance: boolean;
  left: SeatItem[];
  middle: SeatItem[];
  right: SeatItem[];
}

export const seatId = (row: number, col: number) => `R${row}C${col}`;

export function parseSeatId(id: string): { row: number; col: number } | null {
  const m = /^R(\d+)C(\d+)$/.exec(id);
  return m ? { row: Number(m[1]), col: Number(m[2]) } : null;
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

function makeSeat(row: number, col: number): SeatItem {
  return {
    key: seatId(row, col),
    row,
    colStart: col,
    colEnd: col,
    couch: false,
    accessible: row === 1 && col >= 10 && col <= 15,
    ids: [seatId(row, col)],
    price: priceOf(row, false),
  };
}

function makeCouch(row: number, start: number): SeatItem {
  return {
    key: seatId(row, start),
    row,
    colStart: start,
    colEnd: start + 1,
    couch: true,
    accessible: false,
    ids: [seatId(row, start), seatId(row, start + 1)],
    price: priceOf(row, true),
  };
}

function itemsInRange(row: number, from: number, to: number): SeatItem[] {
  const items: SeatItem[] = [];
  if (row === COUCH_ROW) {
    for (let c = from; c < to; c += 2) items.push(makeCouch(row, c));
  } else {
    for (let c = from; c <= to; c++) items.push(makeSeat(row, c));
  }
  return items;
}

export const AUDITORIUM: AuditoriumRow[] = Array.from({ length: ROW_COUNT }, (_, i) => {
  const row = i + 1;
  const entrance = row <= 10;
  return {
    row,
    entrance,
    left: entrance ? [] : itemsInRange(row, 1, 4),
    middle: itemsInRange(row, 5, 20),
    right: itemsInRange(row, 21, 24),
  };
});

export function itemsFromIds(ids: string[]): SeatItem[] {
  const items = new Map<string, SeatItem>();
  for (const id of ids) {
    const p = parseSeatId(id);
    if (!p) continue;
    const item = p.row === COUCH_ROW ? makeCouch(p.row, p.col % 2 === 1 ? p.col : p.col - 1) : makeSeat(p.row, p.col);
    items.set(item.key, item);
  }
  return [...items.values()].sort((a, b) => a.row - b.row || a.colStart - b.colStart);
}

export function describeItem(item: SeatItem): string {
  return item.couch ? `${item.colStart}-${item.colEnd}` : String(item.colStart);
}

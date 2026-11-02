export interface SeatItem {
  kind: 'seat';
  row: number;
  column: number;
  id: string;
  accessible: boolean;
}

export interface CouchItem {
  kind: 'couch';
  row: number;
  start: number;
  end: number;
  ids: [string, string];
}

export type AuditoriumItem = SeatItem | CouchItem;

export interface RowLayout {
  row: number;
  blocks: [AuditoriumItem[], AuditoriumItem[], AuditoriumItem[]];
}

export const ROW_COUNT = 15;
export const COUCH_ROW = 15;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

function seatsIn(row: number, from: number, to: number): SeatItem[] {
  const items: SeatItem[] = [];
  for (let column = from; column <= to; column++) {
    items.push({
      kind: 'seat',
      row,
      column,
      id: seatId(row, column),
      accessible: isAccessible(row, column),
    });
  }
  return items;
}

function couchesIn(row: number, from: number, to: number): CouchItem[] {
  const items: CouchItem[] = [];
  for (let start = from; start <= to; start += 2) {
    const end = start + 1;
    items.push({ kind: 'couch', row, start, end, ids: [seatId(row, start), seatId(row, end)] });
  }
  return items;
}

function rowItems(row: number, from: number, to: number): AuditoriumItem[] {
  return row === COUCH_ROW ? couchesIn(row, from, to) : seatsIn(row, from, to);
}

export function buildAuditorium(): RowLayout[] {
  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const row = index + 1;
    const entrance = row <= 10;
    return {
      row,
      blocks: [entrance ? [] : rowItems(row, 1, 4), rowItems(row, 5, 20), rowItems(row, 21, 24)],
    };
  });
}

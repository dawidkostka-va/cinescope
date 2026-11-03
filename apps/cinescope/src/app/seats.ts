export const MAX_SEATS = 10;
export const COUCH_ROW = 15;
export const COUCH_PRICE = 89;

export interface SeatPosition {
  row: number;
  column: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): SeatPosition {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat identifier: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function compareSeatIds(a: string, b: string): number {
  const pa = parseSeatId(a);
  const pb = parseSeatId(b);
  return pa.row - pb.row || pa.column - pb.column;
}

export function sortSeatIds(ids: string[]): string[] {
  return [...ids].sort(compareSeatIds);
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
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

export function couchIds(startColumn: number): [string, string] {
  return [seatId(COUCH_ROW, startColumn), seatId(COUCH_ROW, startColumn + 1)];
}

export interface SeatItem {
  row: number;
  ids: string[];
  label: string;
  price: number;
}

export function bookedItems(seats: string[]): SeatItem[] {
  const sorted = sortSeatIds(seats);
  const items: SeatItem[] = [];
  const used = new Set<string>();
  for (const id of sorted) {
    if (used.has(id)) {
      continue;
    }
    const { row, column } = parseSeatId(id);
    if (row === COUCH_ROW) {
      const startColumn = column % 2 === 1 ? column : column - 1;
      const ids = couchIds(startColumn);
      ids.forEach((seat) => used.add(seat));
      items.push({ row, ids, label: `Couch ${startColumn}-${startColumn + 1}`, price: COUCH_PRICE });
    } else {
      used.add(id);
      items.push({ row, ids: [id], label: String(column), price: seatPrice(row) });
    }
  }
  return items;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export function toggleSeats(
  current: string[],
  ids: string[],
): { seats: string[]; exceedsLimit: boolean } {
  const selected = ids.every((id) => current.includes(id));
  if (selected) {
    return { seats: current.filter((id) => !ids.includes(id)), exceedsLimit: false };
  }
  if (current.length + ids.length > MAX_SEATS) {
    return { seats: current, exceedsLimit: true };
  }
  return { seats: [...current, ...ids], exceedsLimit: false };
}

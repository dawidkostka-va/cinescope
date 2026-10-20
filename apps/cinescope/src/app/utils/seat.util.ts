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

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function isCouchRow(row: number): boolean {
  return row === 15;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  return 89;
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2)} PLN`;
}

export function couchColumns(seatA: string, seatB: string): [number, number] {
  const a = parseSeatId(seatA).column;
  const b = parseSeatId(seatB).column;
  return a < b ? [a, b] : [b, a];
}

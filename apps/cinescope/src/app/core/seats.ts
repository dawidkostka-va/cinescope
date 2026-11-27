export const ROWS = 15;
export const COLUMNS = 24;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export interface TicketItem {
  row: number;
  columnStart: number;
  columnEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const COUCH_PRICE = 89;

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

function parseSeatId(id: string): { row: number; column: number } | null {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  return match ? { row: Number(match[1]), column: Number(match[2]) } : null;
}

export function ticketItems(seatIds: readonly string[]): TicketItem[] {
  const parsed = seatIds
    .map((id) => ({ id, ...parseSeatId(id) }))
    .filter(
      (s): s is { id: string; row: number; column: number } =>
        s.row !== undefined && s.column !== undefined,
    )
    .sort((a, b) => a.row - b.row || a.column - b.column);

  const items: TicketItem[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const seat = parsed[i];
    if (seat.row === COUCH_ROW) {
      const next = parsed[i + 1];
      items.push({
        row: seat.row,
        columnStart: seat.column,
        columnEnd: next ? next.column : seat.column + 1,
        couch: true,
        ids: next ? [seat.id, next.id] : [seat.id],
        price: COUCH_PRICE,
      });
      i++;
    } else {
      items.push({
        row: seat.row,
        columnStart: seat.column,
        columnEnd: seat.column,
        couch: false,
        ids: [seat.id],
        price: seatPrice(seat.row),
      });
    }
  }
  return items;
}

export function totalPrice(items: readonly TicketItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

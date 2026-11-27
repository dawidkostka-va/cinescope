export const MAX_SEATS = 10;
export const ROWS = 15;
export const COUCH_ROW = 15;
export const COUCH_PRICE = 89;

export interface TicketItem {
  row: number;
  columnStart: number;
  columnEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export const seatId = (row: number, column: number) => `R${row}C${column}`;

export function rowPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function toItems(seatIds: readonly string[]): TicketItem[] {
  const items = new Map<string, TicketItem>();
  for (const id of seatIds) {
    const match = /^R(\d+)C(\d+)$/.exec(id);
    if (!match) continue;
    const row = Number(match[1]);
    const column = Number(match[2]);
    if (row === COUCH_ROW) {
      const start = column % 2 === 1 ? column : column - 1;
      items.set(`${row}-${start}`, {
        row,
        columnStart: start,
        columnEnd: start + 1,
        couch: true,
        ids: [seatId(row, start), seatId(row, start + 1)],
        price: COUCH_PRICE,
      });
    } else {
      items.set(`${row}-${column}`, {
        row,
        columnStart: column,
        columnEnd: column,
        couch: false,
        ids: [id],
        price: rowPrice(row),
      });
    }
  }
  return [...items.values()].sort((a, b) => a.row - b.row || a.columnStart - b.columnStart);
}

export function totalOf(items: readonly TicketItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

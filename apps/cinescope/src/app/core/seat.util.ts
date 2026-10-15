export interface ParsedSeatId {
  row: number;
  column: number;
}

const SEAT_ID_RE = /^R(\d+)C(\d+)$/;

export function parseSeatId(id: string): ParsedSeatId {
  const match = SEAT_ID_RE.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function sortSeatIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const pa = parseSeatId(a);
    const pb = parseSeatId(b);
    return pa.row - pb.row || pa.column - pb.column;
  });
}

export const COUCH_ROW = 15;
export const COUCH_PRICE = 89;

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39; // rows 11-14; row 15 (couches) priced separately
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export interface BookingItem {
  type: 'seat' | 'couch';
  row: number;
  column?: number;
  columnStart?: number;
  columnEnd?: number;
  price: number;
  seatIds: string[];
}

/** Groups raw seat identifiers into seat/couch items, ordered by row then column. */
export function buildBookingItems(ids: string[]): BookingItem[] {
  const sorted = sortSeatIds(ids);
  const consumed = new Set<string>();
  const items: BookingItem[] = [];

  for (const id of sorted) {
    if (consumed.has(id)) continue;
    const { row, column } = parseSeatId(id);

    if (row === COUCH_ROW) {
      const start = column % 2 === 1 ? column : column - 1;
      const end = start + 1;
      const startId = seatId(row, start);
      const endId = seatId(row, end);
      consumed.add(startId);
      consumed.add(endId);
      items.push({ type: 'couch', row, columnStart: start, columnEnd: end, price: COUCH_PRICE, seatIds: [startId, endId] });
    } else {
      consumed.add(id);
      items.push({ type: 'seat', row, column, price: priceForRow(row), seatIds: [id] });
    }
  }

  return items;
}

export function groupItemsByRow(items: BookingItem[]): { row: number; items: BookingItem[] }[] {
  const map = new Map<number, BookingItem[]>();
  for (const item of items) {
    const list = map.get(item.row) ?? [];
    list.push(item);
    map.set(item.row, list);
  }
  return [...map.entries()].map(([row, rowItems]) => ({ row, items: rowItems }));
}

export function panelSeatLabel(item: BookingItem): string {
  return item.type === 'couch' ? `${item.columnStart}-${item.columnEnd}` : `${item.column}`;
}

export function summarySeatLabel(item: BookingItem): string {
  return item.type === 'couch' ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.column}`;
}

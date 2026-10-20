export interface ParsedSeatId {
  row: number;
  column: number;
}

const SEAT_ID_PATTERN = /^R(\d+)C(\d+)$/;

export function parseSeatId(id: string): ParsedSeatId {
  const match = SEAT_ID_PATTERN.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export const COUCH_ROW = 15;

export function isCouchRow(row: number): boolean {
  return row === COUCH_ROW;
}

const COUCH_PRICE = 89;

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  return COUCH_PRICE;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export type SelectionItemType = 'seat' | 'couch';

export interface SelectionItem {
  row: number;
  sortColumn: number;
  type: SelectionItemType;
  columnStart: number;
  columnEnd: number;
  ids: string[];
  price: number;
}

/** Groups a flat list of selected seat identifiers into seats and couches, ordered by row then column. */
export function buildSelectionItems(seatIds: string[]): SelectionItem[] {
  const items: SelectionItem[] = [];
  const consumed = new Set<string>();

  for (const id of seatIds) {
    if (consumed.has(id)) continue;
    const { row, column } = parseSeatId(id);

    if (isCouchRow(row)) {
      const start = column % 2 === 1 ? column : column - 1;
      const id1 = seatId(row, start);
      const id2 = seatId(row, start + 1);
      consumed.add(id1);
      consumed.add(id2);
      items.push({
        row,
        sortColumn: start,
        type: 'couch',
        columnStart: start,
        columnEnd: start + 1,
        ids: [id1, id2],
        price: COUCH_PRICE,
      });
    } else {
      consumed.add(id);
      items.push({
        row,
        sortColumn: column,
        type: 'seat',
        columnStart: column,
        columnEnd: column,
        ids: [id],
        price: priceForRow(row),
      });
    }
  }

  items.sort((a, b) => a.row - b.row || a.sortColumn - b.sortColumn);
  return items;
}

export function computeTotal(seatIds: string[]): number {
  return buildSelectionItems(seatIds).reduce((sum, item) => sum + item.price, 0);
}

export function seatIdsInSummaryOrder(seatIds: string[]): string[] {
  return buildSelectionItems(seatIds).flatMap((item) => item.ids);
}

export interface SelectedRowGroup {
  row: number;
  display: string;
}

export function groupSelectedByRow(seatIds: string[]): SelectedRowGroup[] {
  const items = buildSelectionItems(seatIds);
  const byRow = new Map<number, string[]>();

  for (const item of items) {
    const display = item.type === 'couch' ? `${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`;
    const existing = byRow.get(item.row);
    if (existing) {
      existing.push(display);
    } else {
      byRow.set(item.row, [display]);
    }
  }

  return Array.from(byRow.entries())
    .map(([row, displays]) => ({ row, display: displays.join(', ') }))
    .sort((a, b) => a.row - b.row);
}

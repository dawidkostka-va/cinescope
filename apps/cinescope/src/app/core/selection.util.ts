import { priceForRow } from './pricing.util';

export interface SeatRef {
  row: number;
  column: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): SeatRef {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export type SelectionItem =
  | { kind: 'seat'; column: number; ids: string[] }
  | { kind: 'couch'; columnStart: number; columnEnd: number; ids: string[] };

export interface SelectionRow {
  row: number;
  items: SelectionItem[];
}

export function groupSelection(seats: string[]): SelectionRow[] {
  const byRow = new Map<number, number[]>();
  for (const id of seats) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }

  const rows = [...byRow.keys()].sort((a, b) => a - b);
  return rows.map((row) => {
    const columns = [...(byRow.get(row) ?? [])].sort((a, b) => a - b);
    if (row === 15) {
      const seen = new Set<number>();
      const items: Extract<SelectionItem, { kind: 'couch' }>[] = [];
      for (const column of columns) {
        if (seen.has(column)) {
          continue;
        }
        const partner = column % 2 === 1 ? column + 1 : column - 1;
        seen.add(column);
        seen.add(partner);
        const columnStart = Math.min(column, partner);
        const columnEnd = Math.max(column, partner);
        items.push({ kind: 'couch', columnStart, columnEnd, ids: [seatId(row, columnStart), seatId(row, columnEnd)] });
      }
      items.sort((a, b) => a.columnStart - b.columnStart);
      return { row, items };
    }
    return {
      row,
      items: columns.map((column) => ({ kind: 'seat', column, ids: [seatId(row, column)] }) as SelectionItem),
    };
  });
}

export function itemPrice(row: number): number {
  return priceForRow(row);
}

export function computeTotal(seats: string[]): number {
  return groupSelection(seats).reduce((sum, selectionRow) => sum + selectionRow.items.length * priceForRow(selectionRow.row), 0);
}

export function seatDescription(item: SelectionItem): string {
  return item.kind === 'seat' ? `${item.column}` : `${item.columnStart}-${item.columnEnd}`;
}

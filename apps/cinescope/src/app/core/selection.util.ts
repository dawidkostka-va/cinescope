import { COUCH_PRICE, COUCH_ROW, parseSeatId, priceForRow, seatId } from './seat-map.util';

export interface SelectionItem {
  row: number;
  isCouch: boolean;
  columnStart: number;
  columnEnd: number;
  ids: string[];
  price: number;
}

export function couchIdsForColumn(row: number, column: number): string[] {
  const start = column % 2 === 1 ? column : column - 1;
  return [seatId(row, start), seatId(row, start + 1)];
}

export function groupSelection(seatIds: string[]): SelectionItem[] {
  const byRow = new Map<number, Set<number>>();
  for (const id of seatIds) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? new Set<number>();
    columns.add(column);
    byRow.set(row, columns);
  }

  const items: SelectionItem[] = [];
  const rows = [...byRow.keys()].sort((a, b) => a - b);

  for (const row of rows) {
    const columnSet = byRow.get(row);
    if (!columnSet) continue;
    const columns = [...columnSet].sort((a, b) => a - b);

    if (row === COUCH_ROW) {
      const seen = new Set<number>();
      for (const column of columns) {
        if (seen.has(column)) continue;
        const start = column % 2 === 1 ? column : column - 1;
        const end = start + 1;
        seen.add(start);
        seen.add(end);
        items.push({
          row,
          isCouch: true,
          columnStart: start,
          columnEnd: end,
          ids: [seatId(row, start), seatId(row, end)],
          price: COUCH_PRICE,
        });
      }
    } else {
      for (const column of columns) {
        items.push({
          row,
          isCouch: false,
          columnStart: column,
          columnEnd: column,
          ids: [seatId(row, column)],
          price: priceForRow(row),
        });
      }
    }
  }

  return items;
}

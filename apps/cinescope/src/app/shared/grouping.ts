import { COUCH_PRICE, parseSeatId, seatId, seatPrice } from './seat-utils';

function groupColumnsByRow(ids: string[]): Map<number, number[]> {
  const byRow = new Map<number, number[]>();
  for (const id of ids) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }
  for (const columns of byRow.values()) {
    columns.sort((a, b) => a - b);
  }
  return byRow;
}

export interface SelectedRowLine {
  row: number;
  text: string;
}

/** Builds the `Row <r>: <seats>` lines of the selected-seats panel (5.5). */
export function buildSelectedRowLines(selectedIds: string[]): SelectedRowLine[] {
  const byRow = groupColumnsByRow(selectedIds);
  return [...byRow.keys()]
    .sort((a, b) => a - b)
    .map((row) => {
      const columns = byRow.get(row) ?? [];
      const text = row === 15 ? pairColumns(columns).map(([a, b]) => `${a}-${b}`).join(', ') : columns.join(', ');
      return { row, text };
    });
}

export interface SummaryItem {
  ids: string[];
  row: number;
  column: number;
  seatLabel: string;
  price: number;
}

/** Builds the summary items (section 6), ordered by row then column. */
export function buildSummaryItems(selectedIds: string[]): SummaryItem[] {
  const byRow = groupColumnsByRow(selectedIds);
  const items: SummaryItem[] = [];
  for (const [row, columns] of byRow) {
    if (row === 15) {
      for (const [a, b] of pairColumns(columns)) {
        items.push({ ids: [seatId(row, a), seatId(row, b)], row, column: a, seatLabel: `Couch ${a}-${b}`, price: COUCH_PRICE });
      }
    } else {
      for (const column of columns) {
        items.push({ ids: [seatId(row, column)], row, column, seatLabel: `${column}`, price: seatPrice(row) });
      }
    }
  }
  items.sort((a, b) => a.row - b.row || a.column - b.column);
  return items;
}

function pairColumns(columns: number[]): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < columns.length; i += 2) {
    pairs.push([columns[i], columns[i + 1]]);
  }
  return pairs;
}

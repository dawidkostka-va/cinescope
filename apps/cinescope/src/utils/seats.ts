export interface SeatModel {
  kind: 'seat';
  row: number;
  column: number;
  accessible: boolean;
}

export interface CouchModel {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
}

export type AuditoriumItem = SeatModel | CouchModel;

export interface AuditoriumRow {
  row: number;
  items: AuditoriumItem[];
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) throw new Error(`Invalid seat id: ${id}`);
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function buildAuditorium(): AuditoriumRow[] {
  const rows: AuditoriumRow[] = [];
  for (let row = 1; row <= 14; row++) {
    const startColumn = row <= 10 ? 5 : 1;
    const items: AuditoriumItem[] = [];
    for (let column = startColumn; column <= 24; column++) {
      items.push({ kind: 'seat', row, column, accessible: isAccessibleSeat(row, column) });
    }
    rows.push({ row, items });
  }
  const couchItems: AuditoriumItem[] = [];
  for (let columnStart = 1; columnStart <= 23; columnStart += 2) {
    couchItems.push({ kind: 'couch', row: 15, columnStart, columnEnd: columnStart + 1 });
  }
  rows.push({ row: 15, items: couchItems });
  return rows;
}

export interface SelectionSeatItem {
  row: number;
  kind: 'seat';
  column: number;
}

export interface SelectionCouchItem {
  row: number;
  kind: 'couch';
  columnStart: number;
  columnEnd: number;
}

export type SelectionItem = SelectionSeatItem | SelectionCouchItem;

export function groupSeatIds(ids: string[]): SelectionItem[] {
  const byRow = new Map<number, number[]>();
  for (const id of ids) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  const items: SelectionItem[] = [];
  for (const row of rows) {
    const columns = [...(byRow.get(row) ?? [])].sort((a, b) => a - b);
    if (row === 15) {
      for (let i = 0; i < columns.length; i += 2) {
        items.push({ row, kind: 'couch', columnStart: columns[i], columnEnd: columns[i + 1] });
      }
    } else {
      for (const column of columns) items.push({ row, kind: 'seat', column });
    }
  }
  return items;
}

export function seatIdsForItem(item: SelectionItem): string[] {
  return item.kind === 'seat'
    ? [seatId(item.row, item.column)]
    : [seatId(item.row, item.columnStart), seatId(item.row, item.columnEnd)];
}

export function flattenItemsToIds(items: SelectionItem[]): string[] {
  return items.flatMap(seatIdsForItem);
}

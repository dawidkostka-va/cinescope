import { COUCH_ROW, parseSeatId, priceForRow, seatId, toCouchPairs } from '../seats/geometry';

export interface TicketItem {
  key: string;
  row: number;
  seatIds: string[];
  description: string;
  price: number;
}

/** Orders seats by row then column, grouping row-15 pairs into couch items. */
export function computeTicketItems(seats: string[]): TicketItem[] {
  const byRow = new Map<number, number[]>();
  for (const id of seats) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }

  const items: TicketItem[] = [];
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  for (const row of rows) {
    const columns = [...(byRow.get(row) ?? [])].sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      for (const [a, b] of toCouchPairs(columns)) {
        items.push({
          key: `R${row}C${a}-${b}`,
          row,
          seatIds: [seatId(row, a), seatId(row, b)],
          description: `Couch ${a}-${b}`,
          price: priceForRow(row),
        });
      }
    } else {
      for (const column of columns) {
        items.push({
          key: seatId(row, column),
          row,
          seatIds: [seatId(row, column)],
          description: String(column),
          price: priceForRow(row),
        });
      }
    }
  }
  return items;
}

export function totalPrice(items: TicketItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export interface SeatRowGroup {
  row: number;
  label: string;
}

/** One line per row holding a selection: columns joined, row-15 pairs shown as "a-b". */
export function groupSeatsByRow(seats: string[]): SeatRowGroup[] {
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
    const label =
      row === COUCH_ROW
        ? toCouchPairs(columns)
            .map(([a, b]) => `${a}-${b}`)
            .join(', ')
        : columns.join(', ');
    return { row, label };
  });
}

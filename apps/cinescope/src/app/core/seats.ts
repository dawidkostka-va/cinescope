export const ROWS = 15;
export const COLUMNS = 24;
export const MAX_SEATS = 10;
export const COUCH_ROW = 15;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatCell {
  kind: 'seat';
  row: number;
  column: number;
  ids: string[];
}

export interface CouchCell {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  ids: string[];
}

export type Cell = SeatCell | CouchCell;

export interface RowLayout {
  row: number;
  hasEntrance: boolean;
  left: Cell[];
  middle: Cell[];
  right: Cell[];
}

export const seatId = (row: number, column: number) => `R${row}C${column}`;

export function priceOfRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const COUCH_PRICE = 89;

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

function cellsFor(row: number, from: number, to: number): Cell[] {
  const cells: Cell[] = [];
  if (row === COUCH_ROW) {
    for (let c = from; c <= to; c += 2) {
      cells.push({ kind: 'couch', row, columnStart: c, columnEnd: c + 1, ids: [seatId(row, c), seatId(row, c + 1)] });
    }
  } else {
    for (let c = from; c <= to; c++) {
      cells.push({ kind: 'seat', row, column: c, ids: [seatId(row, c)] });
    }
  }
  return cells;
}

export const LAYOUT: RowLayout[] = Array.from({ length: ROWS }, (_, i) => {
  const row = i + 1;
  const hasEntrance = row <= 10;
  return {
    row,
    hasEntrance,
    left: hasEntrance ? [] : cellsFor(row, 1, 4),
    middle: cellsFor(row, 5, 20),
    right: cellsFor(row, 21, 24),
  };
});

export function isAccessible(cell: Cell): boolean {
  return cell.kind === 'seat' && cell.row === 1 && cell.column >= 10 && cell.column <= 15;
}

export function cellState(cell: Cell, selected: ReadonlySet<string>, occupied: ReadonlySet<string>): SeatState {
  if (cell.ids.some((id) => occupied.has(id))) return 'unavailable';
  if (cell.ids.every((id) => selected.has(id))) return 'selected';
  if (isAccessible(cell)) return 'accessible';
  return 'available';
}

export interface TicketItem {
  row: number;
  column: number;
  columnEnd: number | null;
  ids: string[];
  price: number;
}

const ID_PATTERN = /^R(\d+)C(\d+)$/;

export function parseSeatId(id: string): { row: number; column: number } {
  const match = ID_PATTERN.exec(id);
  return { row: Number(match?.[1]), column: Number(match?.[2]) };
}

export function ticketItems(seatIds: readonly string[]): TicketItem[] {
  const items: TicketItem[] = [];
  const parsed = seatIds.map((id) => ({ id, ...parseSeatId(id) })).sort((a, b) => a.row - b.row || a.column - b.column);
  for (let i = 0; i < parsed.length; i++) {
    const seat = parsed[i];
    if (seat.row === COUCH_ROW) {
      const next = parsed[i + 1];
      if (next && next.row === COUCH_ROW && next.column === seat.column + 1) {
        items.push({
          row: seat.row,
          column: seat.column,
          columnEnd: next.column,
          ids: [seat.id, next.id],
          price: COUCH_PRICE,
        });
        i++;
        continue;
      }
    }
    items.push({ row: seat.row, column: seat.column, columnEnd: null, ids: [seat.id], price: priceOfRow(seat.row) });
  }
  return items;
}

export const itemsTotal = (items: readonly TicketItem[]) => items.reduce((sum, item) => sum + item.price, 0);

export const itemLabel = (item: TicketItem) => (item.columnEnd === null ? `${item.column}` : `${item.column}-${item.columnEnd}`);

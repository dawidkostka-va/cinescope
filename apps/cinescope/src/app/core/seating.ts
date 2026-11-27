export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface Cell {
  kind: 'seat' | 'couch';
  row: number;
  start: number;
  end: number;
}

export interface Block {
  cells: Cell[] | null;
}

export interface SeatRow {
  row: number;
  blocks: Block[];
}

export interface Item extends Cell {
  ids: string[];
  price: number;
}

export const seatId = (row: number, column: number) => `R${row}C${column}`;

export function cellIds(cell: Cell): string[] {
  return cell.kind === 'couch' ? [seatId(cell.row, cell.start), seatId(cell.row, cell.end)] : [seatId(cell.row, cell.start)];
}

export function cellSize(cell: Cell): number {
  return cell.kind === 'couch' ? 2 : 1;
}

export function isAccessible(cell: Cell): boolean {
  return cell.kind === 'seat' && cell.row === 1 && cell.start >= 10 && cell.start <= 15;
}

export function priceOf(cell: Cell): number {
  if (cell.kind === 'couch') {
    return 89;
  }
  if (cell.row <= 5) {
    return 25;
  }
  return cell.row <= 10 ? 32 : 39;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function describe(cell: Cell): string {
  return cell.kind === 'couch' ? `${cell.start}-${cell.end}` : String(cell.start);
}

function buildRow(row: number): SeatRow {
  const range = (from: number, to: number): Cell[] => {
    const cells: Cell[] = [];
    if (row === COUCH_ROW) {
      for (let c = from; c < to; c += 2) {
        cells.push({ kind: 'couch', row, start: c, end: c + 1 });
      }
    } else {
      for (let c = from; c <= to; c++) {
        cells.push({ kind: 'seat', row, start: c, end: c });
      }
    }
    return cells;
  };
  return {
    row,
    blocks: [{ cells: row >= 11 ? range(1, 4) : null }, { cells: range(5, 20) }, { cells: range(21, 24) }],
  };
}

export const LAYOUT: SeatRow[] = Array.from({ length: ROW_COUNT }, (_, i) => buildRow(i + 1));

const ALL_CELLS: Cell[] = LAYOUT.flatMap((r) => r.blocks.flatMap((b) => b.cells ?? []));

export function itemsFromSeats(ids: string[]): Item[] {
  const selected = new Set(ids);
  return ALL_CELLS.filter((cell) => cellIds(cell).every((id) => selected.has(id))).map((cell) => ({
    ...cell,
    ids: cellIds(cell),
    price: priceOf(cell),
  }));
}

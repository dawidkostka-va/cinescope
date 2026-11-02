export const ROWS = 15;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatCell {
  kind: 'seat';
  row: number;
  column: number;
}

export interface CouchCell {
  kind: 'couch';
  row: number;
  start: number;
  end: number;
}

export type Cell = SeatCell | CouchCell;

export interface RowLayout {
  row: number;
  entrance: boolean;
  blocks: Cell[][];
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const [, row, column] = id.match(/^R(\d+)C(\d+)$/) ?? [];
  return { row: Number(row), column: Number(column) };
}

export function compareSeatIds(a: string, b: string): number {
  const first = parseSeatId(a);
  const second = parseSeatId(b);
  return first.row - second.row || first.column - second.column;
}

function cellsBetween(row: number, from: number, to: number): Cell[] {
  const cells: Cell[] = [];
  if (row === COUCH_ROW) {
    for (let start = from; start <= to; start += 2) {
      cells.push({ kind: 'couch', row, start, end: start + 1 });
    }
  } else {
    for (let column = from; column <= to; column++) {
      cells.push({ kind: 'seat', row, column });
    }
  }
  return cells;
}

export function auditoriumLayout(): RowLayout[] {
  return Array.from({ length: ROWS }, (_, index) => {
    const row = index + 1;
    const entrance = row <= 10;
    return {
      row,
      entrance,
      blocks: [
        entrance ? [] : cellsBetween(row, 1, 4),
        cellsBetween(row, 5, 20),
        cellsBetween(row, 21, 24),
      ],
    };
  });
}

export function cellIds(cell: Cell): string[] {
  return cell.kind === 'seat'
    ? [seatId(cell.row, cell.column)]
    : [seatId(cell.row, cell.start), seatId(cell.row, cell.end)];
}

export function cellKey(cell: Cell): string {
  return cell.kind === 'seat' ? `${cell.row}:${cell.column}` : `${cell.row}:${cell.start}`;
}

export function cellState(
  cell: Cell,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  const ids = cellIds(cell);
  if (ids.some((id) => occupied.has(id))) {
    return 'unavailable';
  }
  if (selected.has(ids[0])) {
    return 'selected';
  }
  return cell.kind === 'seat' && cell.row === 1 && cell.column >= 10 && cell.column <= 15
    ? 'accessible'
    : 'available';
}

export function cellLabel(cell: Cell): string {
  return cell.kind === 'seat' ? `${cell.column}` : `${cell.start}-${cell.end}`;
}

export function cellPrice(cell: Cell): number {
  if (cell.kind === 'couch') {
    return 89;
  }
  if (cell.row <= 5) {
    return 25;
  }
  return cell.row <= 10 ? 32 : 39;
}

export function formatPln(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export function ticketsOf(seatIds: string[]): Cell[] {
  const tickets: Cell[] = [];
  for (const id of [...seatIds].sort(compareSeatIds)) {
    const { row, column } = parseSeatId(id);
    if (row !== COUCH_ROW) {
      tickets.push({ kind: 'seat', row, column });
      continue;
    }
    const start = column % 2 === 1 ? column : column - 1;
    const last = tickets.at(-1);
    if (last?.kind === 'couch' && last.start === start) {
      continue;
    }
    tickets.push({ kind: 'couch', row, start, end: start + 1 });
  }
  return tickets;
}

export function totalOf(seatIds: string[]): number {
  return ticketsOf(seatIds).reduce((total, cell) => total + cellPrice(cell), 0);
}

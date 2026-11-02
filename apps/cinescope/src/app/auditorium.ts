export interface SeatCell {
  kind: 'seat';
  id: string;
  ids: string[];
  row: number;
  column: number;
  accessible: boolean;
}

export interface CouchCell {
  kind: 'couch';
  id: string;
  ids: string[];
  row: number;
  start: number;
  end: number;
}

export type Cell = SeatCell | CouchCell;

export interface AuditoriumRow {
  row: number;
  cells: Cell[];
}

const ROW_COUNT = 15;
const COLUMN_COUNT = 24;
const COUCH_ROW = 15;

function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

function buildAuditorium(): AuditoriumRow[] {
  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const row = index + 1;
    if (row === COUCH_ROW) {
      const cells: CouchCell[] = [];
      for (let start = 1; start < COLUMN_COUNT; start += 2) {
        const end = start + 1;
        cells.push({
          kind: 'couch',
          id: seatId(row, start),
          ids: [seatId(row, start), seatId(row, end)],
          row,
          start,
          end,
        });
      }
      return { row, cells };
    }
    const firstColumn = row <= 10 ? 5 : 1;
    const cells: SeatCell[] = [];
    for (let column = firstColumn; column <= COLUMN_COUNT; column++) {
      const id = seatId(row, column);
      cells.push({
        kind: 'seat',
        id,
        ids: [id],
        row,
        column,
        accessible: row === 1 && column >= 10 && column <= 15,
      });
    }
    return { row, cells };
  });
}

export const auditoriumRows = buildAuditorium();

const cellsById = new Map<string, Cell>(
  auditoriumRows.flatMap((auditoriumRow) => auditoriumRow.cells).map((cell): [string, Cell] => [cell.id, cell]),
);

export function cellsForIds(ids: string[]): Cell[] {
  return ids.flatMap((id) => cellsById.get(id) ?? []);
}

export function seatCount(cell: Cell): number {
  return cell.ids.length;
}

function firstColumn(cell: Cell): number {
  return cell.kind === 'couch' ? cell.start : cell.column;
}

export function sortByPosition(cells: Cell[]): Cell[] {
  return [...cells].sort((a, b) => a.row - b.row || firstColumn(a) - firstColumn(b));
}

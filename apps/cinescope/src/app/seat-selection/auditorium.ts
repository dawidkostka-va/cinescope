export type CellKind = 'seat' | 'couch' | 'aisle' | 'entrance';

export interface Cell {
  kind: CellKind;
  row: number;
  start: number;
  end: number;
  span: number;
  ids: string[];
  accessible: boolean;
}

export interface AuditoriumRow {
  row: number;
  cells: Cell[];
}

const ROW_COUNT = 15;
const COUCH_ROW = 15;
const ENTRANCE_LAST_ROW = 10;
const ACCESSIBLE_ROW = 1;
const ACCESSIBLE_FIRST_COLUMN = 10;
const ACCESSIBLE_LAST_COLUMN = 15;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

function gap(row: number, kind: 'aisle' | 'entrance', span: number): Cell {
  return { kind, row, start: 0, end: 0, span, ids: [], accessible: false };
}

function block(row: number, from: number, to: number): Cell[] {
  const cells: Cell[] = [];
  for (let column = from; column <= to; ) {
    if (row === COUCH_ROW) {
      cells.push({
        kind: 'couch',
        row,
        start: column,
        end: column + 1,
        span: 2,
        ids: [seatId(row, column), seatId(row, column + 1)],
        accessible: false,
      });
      column += 2;
    } else {
      cells.push({
        kind: 'seat',
        row,
        start: column,
        end: column,
        span: 1,
        ids: [seatId(row, column)],
        accessible: row === ACCESSIBLE_ROW && column >= ACCESSIBLE_FIRST_COLUMN && column <= ACCESSIBLE_LAST_COLUMN,
      });
      column += 1;
    }
  }
  return cells;
}

export const AUDITORIUM: AuditoriumRow[] = Array.from({ length: ROW_COUNT }, (_, index) => {
  const row = index + 1;
  const leftBlock = row <= ENTRANCE_LAST_ROW ? [gap(row, 'entrance', 4)] : block(row, 1, 4);
  return {
    row,
    cells: [
      ...leftBlock,
      gap(row, 'aisle', 2),
      ...block(row, 5, 20),
      gap(row, 'aisle', 2),
      ...block(row, 21, 24),
    ],
  };
});

export function isSeatLike(cell: Cell): boolean {
  return cell.kind === 'seat' || cell.kind === 'couch';
}

export function bookedCells(seats: readonly string[]): Cell[] {
  const picked = new Set(seats);
  return AUDITORIUM.flatMap((row) => row.cells).filter(
    (cell) => isSeatLike(cell) && cell.ids.every((id) => picked.has(id)),
  );
}

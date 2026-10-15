export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatCell {
  kind: 'seat';
  row: number;
  column: number;
  id: string;
  accessible: boolean;
}

export interface CouchCell {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  ids: [string, string];
}

export interface AisleCell {
  kind: 'aisle';
}

export interface EmptyCell {
  kind: 'empty';
}

export type AuditoriumCell = SeatCell | CouchCell | AisleCell | EmptyCell;

export interface AuditoriumRow {
  row: number;
  cells: AuditoriumCell[];
}

function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

function seatCell(row: number, column: number): SeatCell {
  const accessible = row === 1 && column >= 10 && column <= 15;
  return { kind: 'seat', row, column, id: seatId(row, column), accessible };
}

function couchCell(row: number, columnStart: number): CouchCell {
  const columnEnd = columnStart + 1;
  return { kind: 'couch', row, columnStart, columnEnd, ids: [seatId(row, columnStart), seatId(row, columnEnd)] };
}

function leftBlock(row: number): AuditoriumCell[] {
  if (row === 15) {
    return [couchCell(row, 1), couchCell(row, 3)];
  }
  if (row <= 10) {
    return [{ kind: 'empty' }];
  }
  return [1, 2, 3, 4].map((column) => seatCell(row, column));
}

function middleBlock(row: number): AuditoriumCell[] {
  if (row === 15) {
    const cells: AuditoriumCell[] = [];
    for (let column = 5; column <= 19; column += 2) {
      cells.push(couchCell(row, column));
    }
    return cells;
  }
  const cells: AuditoriumCell[] = [];
  for (let column = 5; column <= 20; column++) {
    cells.push(seatCell(row, column));
  }
  return cells;
}

function rightBlock(row: number): AuditoriumCell[] {
  if (row === 15) {
    return [couchCell(row, 21), couchCell(row, 23)];
  }
  return [21, 22, 23, 24].map((column) => seatCell(row, column));
}

export function buildAuditorium(): AuditoriumRow[] {
  const rows: AuditoriumRow[] = [];
  for (let row = 1; row <= 15; row++) {
    rows.push({
      row,
      cells: [...leftBlock(row), { kind: 'aisle' }, ...middleBlock(row), { kind: 'aisle' }, ...rightBlock(row)],
    });
  }
  return rows;
}

export function cellIds(cell: SeatCell | CouchCell): string[] {
  return cell.kind === 'seat' ? [cell.id] : cell.ids;
}

export function stateOf(ids: string[], accessible: boolean, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): SeatState {
  if (ids.some((id) => occupied.has(id))) {
    return 'unavailable';
  }
  if (ids.every((id) => selected.has(id))) {
    return 'selected';
  }
  return accessible ? 'accessible' : 'available';
}

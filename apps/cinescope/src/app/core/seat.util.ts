export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatCell {
  kind: 'seat';
  row: number;
  column: number;
}

export interface CouchCell {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
}

export interface GapCell {
  kind: 'aisle' | 'empty';
}

export type RowCell = SeatCell | CouchCell | GapCell;

export const TOTAL_ROWS = 15;
export const COUCH_ROW = 15;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function couchIds(row: number, columnStart: number, columnEnd: number): [string, string] {
  return [seatId(row, columnStart), seatId(row, columnEnd)];
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) throw new Error(`Invalid seat id: ${id}`);
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  throw new Error(`No single-seat price for row ${row}`);
}

export const COUCH_PRICE = 89;

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

/** Builds the 24-column-wide row definition (as grid cells, including aisles and the entrance gap). */
export function buildRow(row: number): RowCell[] {
  const cells: RowCell[] = [];

  if (row === COUCH_ROW) {
    cells.push({ kind: 'couch', row, columnStart: 1, columnEnd: 2 });
    cells.push({ kind: 'couch', row, columnStart: 3, columnEnd: 4 });
  } else if (row >= 11) {
    for (let c = 1; c <= 4; c++) cells.push({ kind: 'seat', row, column: c });
  } else {
    for (let c = 1; c <= 4; c++) cells.push({ kind: 'empty' });
  }

  cells.push({ kind: 'aisle' });

  if (row === COUCH_ROW) {
    for (let c = 5; c <= 19; c += 2) cells.push({ kind: 'couch', row, columnStart: c, columnEnd: c + 1 });
  } else {
    for (let c = 5; c <= 20; c++) cells.push({ kind: 'seat', row, column: c });
  }

  cells.push({ kind: 'aisle' });

  if (row === COUCH_ROW) {
    cells.push({ kind: 'couch', row, columnStart: 21, columnEnd: 22 });
    cells.push({ kind: 'couch', row, columnStart: 23, columnEnd: 24 });
  } else {
    for (let c = 21; c <= 24; c++) cells.push({ kind: 'seat', row, column: c });
  }

  return cells;
}

export interface SeatUnit {
  row: number;
  type: 'seat' | 'couch';
  column?: number;
  columnStart?: number;
  columnEnd?: number;
  price: number;
}

/** Groups a flat list of seat identifiers (as stored in the booking) into priced seat/couch units, ordered by row then column. */
export function toSeatUnits(seatIds: string[]): SeatUnit[] {
  const columnsByRow = new Map<number, number[]>();
  for (const id of seatIds) {
    const { row, column } = parseSeatId(id);
    const columns = columnsByRow.get(row) ?? [];
    columns.push(column);
    columnsByRow.set(row, columns);
  }

  const units: SeatUnit[] = [];
  for (const [row, columns] of columnsByRow) {
    columns.sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      for (let i = 0; i < columns.length; i += 2) {
        units.push({ row, type: 'couch', columnStart: columns[i], columnEnd: columns[i + 1], price: COUCH_PRICE });
      }
    } else {
      for (const column of columns) {
        units.push({ row, type: 'seat', column, price: priceForRow(row) });
      }
    }
  }

  units.sort((a, b) => a.row - b.row || unitColumn(a) - unitColumn(b));
  return units;
}

function unitColumn(unit: SeatUnit): number {
  return unit.type === 'couch' ? (unit.columnStart as number) : (unit.column as number);
}

export function seatUnitLabel(unit: SeatUnit): string {
  return unit.type === 'couch' ? `${unit.columnStart}-${unit.columnEnd}` : `${unit.column}`;
}

export function totalPrice(seatIds: string[]): number {
  return toSeatUnits(seatIds).reduce((sum, unit) => sum + unit.price, 0);
}

export const MAX_SEATS = 10;
export const COLUMNS = 24;
export const ROWS = 15;

export interface SeatRef {
  row: number;
  column: number;
}

export interface Unit {
  row: number;
  columns: number[];
  ids: string[];
  price: number;
  isCouch: boolean;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): SeatRef {
  const [, row, column] = /^R(\d+)C(\d+)$/.exec(id) ?? [];
  return { row: Number(row), column: Number(column) };
}

export function couchStart(column: number): number {
  return column % 2 === 1 ? column : column - 1;
}

export function firstColumn(row: number): number {
  return row <= 10 ? 5 : 1;
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function priceOf(row: number): number {
  if (row <= 5) {
    return 25;
  }
  if (row <= 10) {
    return 32;
  }
  if (row <= 14) {
    return 39;
  }
  return 89;
}

export function groupIntoUnits(ids: string[]): Unit[] {
  const sorted = [...ids]
    .map((id) => ({ id, ...parseSeatId(id) }))
    .sort((a, b) => a.row - b.row || a.column - b.column);
  const units: Unit[] = [];
  for (const { id, row, column } of sorted) {
    if (row === ROWS) {
      const start = couchStart(column);
      const last = units[units.length - 1];
      if (last?.isCouch && last.row === row && last.columns[0] === start) {
        last.ids.push(id);
        last.columns.push(column);
      } else {
        units.push({ row, columns: [column], ids: [id], price: priceOf(row), isCouch: true });
      }
    } else {
      units.push({ row, columns: [column], ids: [id], price: priceOf(row), isCouch: false });
    }
  }
  return units;
}

export function unitLabel(unit: Unit): string {
  if (!unit.isCouch) {
    return String(unit.columns[0]);
  }
  return unit.columns.length === 2 ? `${unit.columns[0]}-${unit.columns[1]}` : String(unit.columns[0]);
}

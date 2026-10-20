export const TOTAL_ROWS = 15;
export const TOTAL_COLUMNS = 24;
export const COUCH_ROW = 15;
export const MAX_SEATS = 10;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function rowExistsAtColumn(row: number, column: number): boolean {
  if (row >= 1 && row <= 10) {
    return column >= 5 && column <= TOTAL_COLUMNS;
  }
  return column >= 1 && column <= TOTAL_COLUMNS;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  return 89;
}

export const COUCH_STARTS = Array.from({ length: 12 }, (_, i) => i * 2 + 1);

export function columnTrack(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export function seatState(
  row: number,
  column: number,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  const id = seatId(row, column);
  if (occupied.has(id)) return 'unavailable';
  if (selected.has(id)) return 'selected';
  if (isAccessible(row, column)) return 'accessible';
  return 'available';
}

export function couchState(
  row: number,
  startColumn: number,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  const idA = seatId(row, startColumn);
  const idB = seatId(row, startColumn + 1);
  if (occupied.has(idA) || occupied.has(idB)) return 'unavailable';
  if (selected.has(idA) || selected.has(idB)) return 'selected';
  return 'available';
}

export interface SelectionUnit {
  row: number;
  ids: string[];
  isCouch: boolean;
  columns: number[];
}

export function computeSelectionUnits(seats: string[]): SelectionUnit[] {
  const parsed = seats.map(parseSeatId);
  const rowMap = new Map<number, number[]>();
  for (const { row, column } of parsed) {
    const columns = rowMap.get(row) ?? [];
    columns.push(column);
    rowMap.set(row, columns);
  }

  const rows = Array.from(rowMap.keys()).sort((a, b) => a - b);
  const units: SelectionUnit[] = [];

  for (const row of rows) {
    const columns = [...(rowMap.get(row) ?? [])].sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      const columnSet = new Set(columns);
      const handled = new Set<number>();
      for (const column of columns) {
        const start = column % 2 === 1 ? column : column - 1;
        if (handled.has(start)) continue;
        if (columnSet.has(start) && columnSet.has(start + 1)) {
          units.push({
            row,
            ids: [seatId(row, start), seatId(row, start + 1)],
            isCouch: true,
            columns: [start, start + 1],
          });
          handled.add(start);
          handled.add(start + 1);
        }
      }
    } else {
      for (const column of columns) {
        units.push({ row, ids: [seatId(row, column)], isCouch: false, columns: [column] });
      }
    }
  }

  return units;
}

export function unitPrice(unit: SelectionUnit): number {
  return unit.isCouch ? priceForRow(COUCH_ROW) : priceForRow(unit.row);
}

export function unitSeatLabel(unit: SelectionUnit): string {
  return unit.isCouch ? `${unit.columns[0]}-${unit.columns[1]}` : `${unit.columns[0]}`;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

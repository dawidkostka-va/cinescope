export const MAX_SEATS = 10;
export const COUCH_ROW = 15;

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

export function rowPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  return 89;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export interface SelectionUnit {
  row: number;
  columnStart: number;
  columnEnd?: number;
  ids: string[];
  isCouch: boolean;
  price: number;
}

/** Groups a flat list of seat identifiers into seats/couches, ordered by row then column. */
export function buildUnits(seats: string[]): SelectionUnit[] {
  const byRow = new Map<number, number[]>();
  for (const id of seats) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }

  const units: SelectionUnit[] = [];
  const sortedEntries = [...byRow.entries()].sort(([a], [b]) => a - b);
  for (const [row, unsortedColumns] of sortedEntries) {
    const columns = [...unsortedColumns].sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      for (let i = 0; i < columns.length; i += 2) {
        const start = columns[i];
        const end = columns[i + 1];
        units.push({
          row,
          columnStart: start,
          columnEnd: end,
          ids: [seatId(row, start), seatId(row, end)],
          isCouch: true,
          price: rowPrice(row),
        });
      }
    } else {
      for (const column of columns) {
        units.push({
          row,
          columnStart: column,
          ids: [seatId(row, column)],
          isCouch: false,
          price: rowPrice(row),
        });
      }
    }
  }
  return units;
}

export interface SelectionRowGroup {
  row: number;
  label: string;
}

export function groupSelectionByRow(seats: string[]): SelectionRowGroup[] {
  return buildUnits(seats).reduce<SelectionRowGroup[]>((groups, unit) => {
    const label = unit.isCouch ? `${unit.columnStart}-${unit.columnEnd}` : `${unit.columnStart}`;
    const last = groups[groups.length - 1];
    if (last && last.row === unit.row) {
      last.label = `${last.label}, ${label}`;
    } else {
      groups.push({ row: unit.row, label });
    }
    return groups;
  }, []);
}

export function orderedSeatIds(seats: string[]): string[] {
  return buildUnits(seats).flatMap((unit) => unit.ids);
}

export function totalPrice(seats: string[]): number {
  return buildUnits(seats).reduce((sum, unit) => sum + unit.price, 0);
}

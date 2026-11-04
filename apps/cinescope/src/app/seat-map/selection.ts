import { seatId } from './auditorium';

export const MAX_SEATS = 10;

const COUCH_ROW = 15;

export interface SelectionUnit {
  row: number;
  startColumn: number;
  endColumn: number;
  ids: string[];
}

export interface SelectionLine {
  row: number;
  seats: string;
}

export function selectionUnits(ids: ReadonlySet<string>): SelectionUnit[] {
  const columnsByRow = new Map<number, number[]>();
  for (const id of ids) {
    const [row, column] = id.slice(1).split('C').map(Number);
    columnsByRow.set(row, [...(columnsByRow.get(row) ?? []), column]);
  }
  return [...columnsByRow.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([row, columns]) => {
      const sorted = columns.sort((a, b) => a - b);
      const units: SelectionUnit[] = [];
      for (let index = 0; index < sorted.length; index++) {
        const startColumn = sorted[index];
        if (row === COUCH_ROW) {
          units.push({
            row,
            startColumn,
            endColumn: startColumn + 1,
            ids: [seatId(row, startColumn), seatId(row, startColumn + 1)],
          });
          index++;
        } else {
          units.push({ row, startColumn, endColumn: startColumn, ids: [seatId(row, startColumn)] });
        }
      }
      return units;
    });
}

export function describeSelection(ids: ReadonlySet<string>): SelectionLine[] {
  const labelsByRow = new Map<number, string[]>();
  for (const unit of selectionUnits(ids)) {
    const label =
      unit.startColumn === unit.endColumn ? `${unit.startColumn}` : `${unit.startColumn}-${unit.endColumn}`;
    labelsByRow.set(unit.row, [...(labelsByRow.get(unit.row) ?? []), label]);
  }
  return [...labelsByRow.entries()].map(([row, labels]) => ({ row, seats: labels.join(', ') }));
}

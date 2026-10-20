import { isCouchRow, parseSeatId, priceForRow, seatId } from './seat.util';

export interface SelectionUnit {
  ids: string[];
  row: number;
  columns: number[];
  isCouch: boolean;
  price: number;
}

/** Groups flat seat identifiers (a couch contributes both of its ids) into seat/couch units. */
export function groupIntoUnits(seatIds: string[]): SelectionUnit[] {
  const units: SelectionUnit[] = [];
  const seen = new Set<string>();
  for (const id of seatIds) {
    if (seen.has(id)) continue;
    const { row, column } = parseSeatId(id);
    if (isCouchRow(row)) {
      const otherColumn = column % 2 === 1 ? column + 1 : column - 1;
      const otherId = seatId(row, otherColumn);
      seen.add(id);
      seen.add(otherId);
      const columns = [column, otherColumn].sort((a, b) => a - b);
      const ids = columns.map((c) => seatId(row, c));
      units.push({ ids, row, columns, isCouch: true, price: priceForRow(row) });
    } else {
      seen.add(id);
      units.push({ ids: [id], row, columns: [column], isCouch: false, price: priceForRow(row) });
    }
  }
  return units.sort((a, b) => a.row - b.row || a.columns[0] - b.columns[0]);
}

export function unitSeatLabel(unit: SelectionUnit): string {
  return unit.isCouch ? `Couch ${unit.columns[0]}-${unit.columns[1]}` : `${unit.columns[0]}`;
}

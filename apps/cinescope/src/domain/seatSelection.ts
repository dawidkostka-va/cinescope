import { COUCH_PRICE, getSeatPrice } from './pricing';
import { COUCH_ROW, seatId } from './seatLayout';

export interface SelectedSeatUnit {
  row: number;
  kind: 'seat';
  column: number;
  price: number;
}

export interface SelectedCouchUnit {
  row: number;
  kind: 'couch';
  columnStart: number;
  columnEnd: number;
  price: number;
}

export type SelectedUnit = SelectedSeatUnit | SelectedCouchUnit;

function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

/**
 * Groups the booking's flat seat identifiers into seat/couch units, sorted by
 * row then column — the "summary order" used by the panel, the summary list
 * and the reservation payload.
 */
export function getSortedSelectedUnits(seats: string[]): SelectedUnit[] {
  const units: SelectedUnit[] = [];
  const seenCouchStarts = new Set<string>();

  for (const id of seats) {
    const { row, column } = parseSeatId(id);
    if (row === COUCH_ROW) {
      const columnStart = column % 2 === 1 ? column : column - 1;
      const columnEnd = columnStart + 1;
      const key = `${row}-${columnStart}`;
      if (seenCouchStarts.has(key)) {
        continue;
      }
      seenCouchStarts.add(key);
      units.push({ row, kind: 'couch', columnStart, columnEnd, price: COUCH_PRICE });
    } else {
      units.push({ row, kind: 'seat', column, price: getSeatPrice(row) });
    }
  }

  return units.sort((a, b) => {
    if (a.row !== b.row) {
      return a.row - b.row;
    }
    const aColumn = a.kind === 'seat' ? a.column : a.columnStart;
    const bColumn = b.kind === 'seat' ? b.column : b.columnStart;
    return aColumn - bColumn;
  });
}

export function unitToSeatIds(unit: SelectedUnit): string[] {
  if (unit.kind === 'seat') {
    return [seatId(unit.row, unit.column)];
  }
  return [seatId(unit.row, unit.columnStart), seatId(unit.row, unit.columnEnd)];
}

export function getTotalPrice(units: SelectedUnit[]): number {
  return units.reduce((sum, unit) => sum + unit.price, 0);
}

export function formatUnitSeatLabel(unit: SelectedUnit): string {
  return unit.kind === 'seat' ? String(unit.column) : `${unit.columnStart}-${unit.columnEnd}`;
}

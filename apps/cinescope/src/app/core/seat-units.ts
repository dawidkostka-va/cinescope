export const MAX_SEATS_PER_BOOKING = 10;

export interface SeatUnit {
  row: number;
  start: number;
  end: number;
  couch: boolean;
  ids: string[];
}

const SEAT_ID = /^R(\d+)C(\d+)$/;

export function parseSeatId(id: string): { row: number; column: number } {
  const [, row, column] = SEAT_ID.exec(id) ?? [];
  return { row: Number(row), column: Number(column) };
}

export function sortSeatIds(ids: readonly string[]): string[] {
  return [...ids].sort((a, b) => {
    const left = parseSeatId(a);
    const right = parseSeatId(b);
    return left.row - right.row || left.column - right.column;
  });
}

export function toUnits(ids: readonly string[]): SeatUnit[] {
  const units: SeatUnit[] = [];
  const sorted = sortSeatIds(ids);
  for (let index = 0; index < sorted.length; index++) {
    const { row, column } = parseSeatId(sorted[index]);
    if (row === 15) {
      units.push({ row, start: column, end: column + 1, couch: true, ids: [sorted[index], sorted[index + 1]] });
      index++;
    } else {
      units.push({ row, start: column, end: column, couch: false, ids: [sorted[index]] });
    }
  }
  return units;
}

export function unitLabel(unit: SeatUnit): string {
  return unit.couch ? `${unit.start}-${unit.end}` : `${unit.start}`;
}

export function unitDescription(unit: SeatUnit): string {
  return unit.couch ? `Couch ${unit.start}-${unit.end}` : `${unit.start}`;
}

export function bookingTotal(ids: readonly string[], priceOf: (unit: SeatUnit) => number): number {
  return toUnits(ids).reduce((sum, unit) => sum + priceOf(unit), 0);
}

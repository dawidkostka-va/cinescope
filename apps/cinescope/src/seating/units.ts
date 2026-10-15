import { COUCH_ROW, priceForRow, seatId } from './layout';

export interface SingleSeatUnit {
  type: 'seat';
  id: string;
  row: number;
  col: number;
}

export interface CouchUnit {
  type: 'couch';
  ids: [string, string];
  row: number;
  colStart: number;
  colEnd: number;
}

export type Unit = SingleSeatUnit | CouchUnit;

export function parseSeatId(id: string): { row: number; col: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat identifier: ${id}`);
  }
  return { row: Number(match[1]), col: Number(match[2]) };
}

export function unitColumn(unit: Unit): number {
  return unit.type === 'seat' ? unit.col : unit.colStart;
}

export function unitsFromSeats(seats: string[]): Unit[] {
  const parsed = seats.map((id) => ({ id, ...parseSeatId(id) }));
  const byRow = new Map<number, { id: string; row: number; col: number }[]>();
  for (const seat of parsed) {
    const existing = byRow.get(seat.row);
    if (existing) {
      existing.push(seat);
    } else {
      byRow.set(seat.row, [seat]);
    }
  }

  const units: Unit[] = [];
  for (const [row, seatsInRow] of byRow) {
    seatsInRow.sort((a, b) => a.col - b.col);
    if (row === COUCH_ROW) {
      for (let i = 0; i < seatsInRow.length; i += 2) {
        const a = seatsInRow[i];
        const b = seatsInRow[i + 1];
        units.push({ type: 'couch', ids: [a.id, b.id], row, colStart: a.col, colEnd: b.col });
      }
    } else {
      for (const seat of seatsInRow) {
        units.push({ type: 'seat', id: seat.id, row, col: seat.col });
      }
    }
  }

  units.sort((a, b) => a.row - b.row || unitColumn(a) - unitColumn(b));
  return units;
}

export function unitIds(unit: Unit): string[] {
  return unit.type === 'seat' ? [unit.id] : unit.ids;
}

export function unitSeatCount(unit: Unit): number {
  return unit.type === 'seat' ? 1 : 2;
}

export function unitPrice(unit: Unit): number {
  return priceForRow(unit.row);
}

export function unitSeatDescription(unit: Unit): string {
  return unit.type === 'seat' ? String(unit.col) : `${unit.colStart}-${unit.colEnd}`;
}

export function unitCouchLabel(unit: CouchUnit): string {
  return `Couch ${unit.colStart}-${unit.colEnd}`;
}

export function couchIds(row: number, colStart: number, colEnd: number): [string, string] {
  return [seatId(row, colStart), seatId(row, colEnd)];
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

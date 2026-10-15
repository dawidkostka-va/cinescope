import { priceForRow } from './seat-pricing';

export interface SeatGroup {
  row: number;
  kind: 'seat' | 'couch';
  column: number | null;
  columnStart: number | null;
  columnEnd: number | null;
  price: number;
  ids: string[];
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function groupSeats(ids: string[]): SeatGroup[] {
  const parsed = ids.map((id) => ({ id, ...parseSeatId(id) }));
  const byRow = new Map<number, { id: string; row: number; column: number }[]>();
  for (const seat of parsed) {
    const list = byRow.get(seat.row) ?? [];
    list.push(seat);
    byRow.set(seat.row, list);
  }

  const rows = [...byRow.keys()].sort((a, b) => a - b);
  const groups: SeatGroup[] = [];
  for (const row of rows) {
    const seats = [...(byRow.get(row) ?? [])].sort((a, b) => a.column - b.column);
    if (row === 15) {
      for (let i = 0; i < seats.length; i += 2) {
        const first = seats[i];
        const second = seats[i + 1];
        groups.push({
          row,
          kind: 'couch',
          column: null,
          columnStart: first.column,
          columnEnd: second.column,
          price: priceForRow(row),
          ids: [first.id, second.id],
        });
      }
    } else {
      for (const seat of seats) {
        groups.push({
          row,
          kind: 'seat',
          column: seat.column,
          columnStart: null,
          columnEnd: null,
          price: priceForRow(row),
          ids: [seat.id],
        });
      }
    }
  }
  return groups;
}

export function sortSeatsForSummary(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const pa = parseSeatId(a);
    const pb = parseSeatId(b);
    return pa.row - pb.row || pa.column - pb.column;
  });
}

export function totalPrice(ids: string[]): number {
  return groupSeats(ids).reduce((sum, group) => sum + group.price, 0);
}

import {
  COUCH_PRICE,
  couchPairStart,
  couchSeatIds,
  isCouchRow,
  parseSeatId,
  priceForRow,
} from './seatMap';

export interface BookingItem {
  key: string;
  row: number;
  column: number;
  isCouch: boolean;
  seatIds: string[];
  seatLabel: string;
  price: number;
}

/** Groups raw seat identifiers into seats/couches, sorted by row then column. */
export function buildBookingItems(seats: string[]): BookingItem[] {
  const items: BookingItem[] = [];
  const consumed = new Set<string>();

  for (const id of seats) {
    if (consumed.has(id)) continue;
    const { row, column } = parseSeatId(id);

    if (isCouchRow(row)) {
      const pairStart = couchPairStart(column);
      const [a, b] = couchSeatIds(row, pairStart);
      consumed.add(a);
      consumed.add(b);
      items.push({
        key: a,
        row,
        column: pairStart,
        isCouch: true,
        seatIds: [a, b],
        seatLabel: `Couch ${pairStart}-${pairStart + 1}`,
        price: COUCH_PRICE,
      });
    } else {
      consumed.add(id);
      items.push({
        key: id,
        row,
        column,
        isCouch: false,
        seatIds: [id],
        seatLabel: String(column),
        price: priceForRow(row),
      });
    }
  }

  items.sort((a, b) => a.row - b.row || a.column - b.column);
  return items;
}

export function totalPrice(seats: string[]): number {
  return buildBookingItems(seats).reduce((sum, item) => sum + item.price, 0);
}

/** Seat identifiers in summary order, a couch contributing both of its identifiers. */
export function summarySeatIds(seats: string[]): string[] {
  return buildBookingItems(seats).flatMap((item) => item.seatIds);
}

export interface SelectedSeatsRow {
  row: number;
  label: string;
}

/** One line per row with a selection, seats ascending, couches shown as `a-b`. */
export function selectedSeatsByRow(seats: string[]): SelectedSeatsRow[] {
  const items = buildBookingItems(seats);
  const byRow = new Map<number, string[]>();

  for (const item of items) {
    const token = item.isCouch ? `${item.column}-${item.column + 1}` : String(item.column);
    const tokens = byRow.get(item.row) ?? [];
    tokens.push(token);
    byRow.set(item.row, tokens);
  }

  return [...byRow.entries()]
    .sort(([a], [b]) => a - b)
    .map(([row, tokens]) => ({ row, label: tokens.join(', ') }));
}

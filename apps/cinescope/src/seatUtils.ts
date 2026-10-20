export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const ACCESSIBLE_ROW = 1;
export const ACCESSIBLE_COLUMNS = [10, 11, 12, 13, 14, 15];
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

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
  return row === ACCESSIBLE_ROW && ACCESSIBLE_COLUMNS.includes(column);
}

/** Columns that hold individual seats in a (non-couch) row. */
export function rowColumns(row: number): number[] {
  if (row === COUCH_ROW) {
    return [];
  }
  if (row <= 10) {
    return range(5, COLUMN_COUNT);
  }
  return range(1, COLUMN_COUNT);
}

/** Couches in row 15, as [columnStart, columnEnd] pairs. */
export function couches(): [number, number][] {
  const pairs: [number, number][] = [];
  for (let c = 1; c < COLUMN_COUNT; c += 2) {
    pairs.push([c, c + 1]);
  }
  return pairs;
}

function range(from: number, to: number): number[] {
  const result: number[] = [];
  for (let i = from; i <= to; i++) {
    result.push(i);
  }
  return result;
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  if (row <= 14) return 39;
  throw new Error('Row 15 only has couches');
}

export const COUCH_PRICE = 89;

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

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
  columnStart: number,
  columnEnd: number,
  occupied: ReadonlySet<string>,
  selected: ReadonlySet<string>,
): SeatState {
  const idA = seatId(row, columnStart);
  const idB = seatId(row, columnEnd);
  if (occupied.has(idA) || occupied.has(idB)) return 'unavailable';
  if (selected.has(idA) && selected.has(idB)) return 'selected';
  return 'available';
}

export interface SeatItem {
  row: number;
  type: 'seat' | 'couch';
  column?: number;
  columnStart?: number;
  columnEnd?: number;
  ids: string[];
  price: number;
}

/** Selected seats and couches, derived from a flat list of seat identifiers. */
export function getBookingItems(seatIds: string[]): SeatItem[] {
  const byRow = new Map<number, number[]>();
  for (const id of seatIds) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }

  const items: SeatItem[] = [];
  for (const [row, columns] of byRow) {
    const sorted = [...columns].sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      for (let i = 0; i < sorted.length; i += 2) {
        const columnStart = sorted[i];
        const columnEnd = sorted[i + 1];
        items.push({
          row,
          type: 'couch',
          columnStart,
          columnEnd,
          ids: [seatId(row, columnStart), seatId(row, columnEnd)],
          price: COUCH_PRICE,
        });
      }
    } else {
      for (const column of sorted) {
        items.push({ row, type: 'seat', column, ids: [seatId(row, column)], price: seatPrice(row) });
      }
    }
  }

  items.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    const aCol = a.type === 'couch' ? (a.columnStart as number) : (a.column as number);
    const bCol = b.type === 'couch' ? (b.columnStart as number) : (b.column as number);
    return aCol - bCol;
  });

  return items;
}

export function seatDescription(item: SeatItem): string {
  return item.type === 'couch' ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.column}`;
}

export function totalPrice(seatIds: string[]): number {
  return getBookingItems(seatIds).reduce((sum, item) => sum + item.price, 0);
}

export function seatCount(seatIds: string[]): number {
  return seatIds.length;
}

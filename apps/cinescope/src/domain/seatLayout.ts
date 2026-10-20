export const TOTAL_ROWS = 15;
export const COUCH_ROW = 15;
export const COUCH_PRICE = 89;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const STATE_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

export const LEGEND_ITEMS: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat identifier: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function priceForRow(row: number): number {
  if (row >= 1 && row <= 5) return 25;
  if (row >= 6 && row <= 10) return 32;
  if (row >= 11 && row <= 14) return 39;
  throw new Error(`Row ${row} has no regular-seat price`);
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2)} PLN`;
}

export type LayoutCell =
  | { type: 'entrance' }
  | { type: 'aisle' }
  | { type: 'seat'; row: number; column: number }
  | { type: 'couch'; row: number; columnStart: number; columnEnd: number };

function blockCells(row: number, start: number, end: number): LayoutCell[] {
  if (row === COUCH_ROW) {
    const cells: LayoutCell[] = [];
    for (let column = start; column <= end; column += 2) {
      cells.push({ type: 'couch', row, columnStart: column, columnEnd: column + 1 });
    }
    return cells;
  }
  const cells: LayoutCell[] = [];
  for (let column = start; column <= end; column++) {
    cells.push({ type: 'seat', row, column });
  }
  return cells;
}

export function getRowCells(row: number): LayoutCell[] {
  const left: LayoutCell[] = row <= 10 ? [{ type: 'entrance' }] : blockCells(row, 1, 4);
  const aisle: LayoutCell = { type: 'aisle' };
  return [...left, aisle, ...blockCells(row, 5, 20), aisle, ...blockCells(row, 21, 24)];
}

export function getSeatState(id: string, occupied: ReadonlySet<string>, selected: ReadonlySet<string>, accessible: boolean): SeatState {
  if (occupied.has(id)) return 'unavailable';
  if (selected.has(id)) return 'selected';
  return accessible ? 'accessible' : 'available';
}

export function getCouchState(idA: string, idB: string, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): SeatState {
  if (occupied.has(idA) || occupied.has(idB)) return 'unavailable';
  if (selected.has(idA) && selected.has(idB)) return 'selected';
  return 'available';
}

export interface BookedItem {
  /** React key, also used to remove this item from the booking */
  key: string;
  row: number;
  /** Column number for a seat, or "a-b" for a couch */
  seatDescription: string;
  price: number;
  /** The one (seat) or two (couch) seat identifiers this item represents */
  ids: string[];
}

/** Groups raw seat identifiers into booked items ordered by row, then by column. */
export function buildBookedItems(seatIds: readonly string[]): BookedItem[] {
  const columnsByRow = new Map<number, number[]>();
  for (const id of seatIds) {
    const { row, column } = parseSeatId(id);
    const columns = columnsByRow.get(row) ?? [];
    columns.push(column);
    columnsByRow.set(row, columns);
  }

  const items: BookedItem[] = [];
  const entries = [...columnsByRow.entries()].sort(([rowA], [rowB]) => rowA - rowB);
  for (const [row, rawColumns] of entries) {
    const columns = [...rawColumns].sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      for (let i = 0; i < columns.length; i += 2) {
        const a = columns[i];
        const b = columns[i + 1];
        items.push({
          key: seatId(row, a),
          row,
          seatDescription: `${a}-${b}`,
          price: COUCH_PRICE,
          ids: [seatId(row, a), seatId(row, b)],
        });
      }
    } else {
      for (const column of columns) {
        items.push({
          key: seatId(row, column),
          row,
          seatDescription: String(column),
          price: priceForRow(row),
          ids: [seatId(row, column)],
        });
      }
    }
  }
  return items;
}

export interface SelectedSeatsRow {
  row: number;
  label: string;
}

/** Builds the `Row <r>: <seats>` lines for the selected-seats panel. */
export function buildSelectedSeatsRows(seatIds: readonly string[]): SelectedSeatsRow[] {
  return buildBookedItems(seatIds).reduce<SelectedSeatsRow[]>((rows, item) => {
    const last = rows[rows.length - 1];
    if (last && last.row === item.row) {
      last.label = `${last.label}, ${item.seatDescription}`;
    } else {
      rows.push({ row: item.row, label: item.seatDescription });
    }
    return rows;
  }, []);
}

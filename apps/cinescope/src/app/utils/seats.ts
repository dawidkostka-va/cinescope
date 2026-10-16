export const ROW_COUNT = 15;
export const COLUMN_COUNT = 24;
export const COUCH_ROW = 15;
export const COUCH_PRICE = 89;
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } | null {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) return null;
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function isAccessibleSeat(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export const STATE_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

export interface SeatCell {
  kind: 'seat';
  column: number;
}
export interface CouchCell {
  kind: 'couch';
  columnStart: number;
  columnEnd: number;
}
export interface AisleCell {
  kind: 'aisle';
}
export interface GapCell {
  kind: 'gap';
}
export type RowCell = SeatCell | CouchCell | AisleCell | GapCell;

export function buildRowCells(row: number): RowCell[] {
  const isCouchRow = row === COUCH_ROW;
  const hasEntranceGap = row <= 10;
  const cells: RowCell[] = [];

  const addSeatBlock = (start: number, end: number) => {
    if (isCouchRow) {
      for (let c = start; c < end; c += 2) {
        cells.push({ kind: 'couch', columnStart: c, columnEnd: c + 1 });
      }
    } else {
      for (let c = start; c <= end; c++) {
        cells.push({ kind: 'seat', column: c });
      }
    }
  };

  if (hasEntranceGap) {
    cells.push({ kind: 'gap' });
  } else {
    addSeatBlock(1, 4);
  }
  cells.push({ kind: 'aisle' });
  addSeatBlock(5, 20);
  cells.push({ kind: 'aisle' });
  addSeatBlock(21, 24);

  return cells;
}

export interface SeatItem {
  ids: string[];
  row: number;
  kind: 'seat' | 'couch';
  column?: number;
  columnStart?: number;
  columnEnd?: number;
  price: number;
  seatLabel: string;
}

export function deriveSeatItems(seatIds: string[]): SeatItem[] {
  const byRow = new Map<number, number[]>();
  for (const id of seatIds) {
    const parsed = parseSeatId(id);
    if (!parsed) continue;
    const list = byRow.get(parsed.row) ?? [];
    list.push(parsed.column);
    byRow.set(parsed.row, list);
  }

  const items: SeatItem[] = [];
  const rows = Array.from(byRow.keys()).sort((a, b) => a - b);
  for (const row of rows) {
    const columns = [...(byRow.get(row) ?? [])].sort((a, b) => a - b);
    if (row === COUCH_ROW) {
      for (let i = 0; i < columns.length; i += 2) {
        const a = columns[i];
        const b = columns[i + 1];
        items.push({
          ids: [seatId(row, a), seatId(row, b)],
          row,
          kind: 'couch',
          columnStart: a,
          columnEnd: b,
          price: COUCH_PRICE,
          seatLabel: `${a}-${b}`,
        });
      }
    } else {
      for (const column of columns) {
        items.push({
          ids: [seatId(row, column)],
          row,
          kind: 'seat',
          column,
          price: priceForRow(row),
          seatLabel: `${column}`,
        });
      }
    }
  }
  return items;
}

export function formatSelectedSeatsLines(seatIds: string[]): { row: number; text: string }[] {
  const items = deriveSeatItems(seatIds);
  const byRow = new Map<number, string[]>();
  for (const item of items) {
    const list = byRow.get(item.row) ?? [];
    list.push(item.seatLabel);
    byRow.set(item.row, list);
  }
  return Array.from(byRow.entries())
    .sort(([a], [b]) => a - b)
    .map(([row, labels]) => ({ row, text: `Row ${row}: ${labels.join(', ')}` }));
}

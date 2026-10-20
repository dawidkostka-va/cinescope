export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function isAccessible(row: number, column: number): boolean {
  return row === 1 && column >= 10 && column <= 15;
}

export function isCouchRow(row: number): boolean {
  return row === 15;
}

export function priceForRow(row: number): number {
  if (row <= 5) {
    return 25;
  }
  if (row <= 10) {
    return 32;
  }
  if (row <= 14) {
    return 39;
  }
  return 89;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export type RowSlot =
  | { kind: 'empty'; columns: number }
  | { kind: 'aisle' }
  | { kind: 'seat'; column: number }
  | { kind: 'couch'; columnStart: number; columnEnd: number };

export function getRowSlots(row: number): RowSlot[] {
  const slots: RowSlot[] = [];
  if (isCouchRow(row)) {
    for (let c = 1; c <= 4; c += 2) {
      slots.push({ kind: 'couch', columnStart: c, columnEnd: c + 1 });
    }
    slots.push({ kind: 'aisle' });
    for (let c = 5; c <= 20; c += 2) {
      slots.push({ kind: 'couch', columnStart: c, columnEnd: c + 1 });
    }
    slots.push({ kind: 'aisle' });
    for (let c = 21; c <= 24; c += 2) {
      slots.push({ kind: 'couch', columnStart: c, columnEnd: c + 1 });
    }
    return slots;
  }

  if (row <= 10) {
    slots.push({ kind: 'empty', columns: 4 });
  } else {
    for (let c = 1; c <= 4; c++) {
      slots.push({ kind: 'seat', column: c });
    }
  }
  slots.push({ kind: 'aisle' });
  for (let c = 5; c <= 20; c++) {
    slots.push({ kind: 'seat', column: c });
  }
  slots.push({ kind: 'aisle' });
  for (let c = 21; c <= 24; c++) {
    slots.push({ kind: 'seat', column: c });
  }
  return slots;
}

export interface ParsedSeatId {
  row: number;
  column: number;
}

export function parseSeatId(id: string): ParsedSeatId {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) {
    throw new Error(`Invalid seat id: ${id}`);
  }
  return { row: Number(match[1]), column: Number(match[2]) };
}

export interface SelectedRowGroup {
  row: number;
  label: string;
}

export function groupSelectedByRow(seats: string[]): SelectedRowGroup[] {
  const byRow = new Map<number, number[]>();
  for (const id of seats) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  return rows.map((row) => {
    const columns = (byRow.get(row) ?? []).slice().sort((a, b) => a - b);
    if (isCouchRow(row)) {
      const parts: string[] = [];
      for (let i = 0; i < columns.length; i += 2) {
        parts.push(`${columns[i]}-${columns[i + 1]}`);
      }
      return { row, label: parts.join(', ') };
    }
    return { row, label: columns.join(', ') };
  });
}

export interface SummaryItem {
  row: number;
  column: number;
  isCouch: boolean;
  columnStart: number;
  columnEnd: number;
  seatIds: string[];
  price: number;
}

export function buildSummaryItems(seats: string[]): SummaryItem[] {
  const byRow = new Map<number, number[]>();
  for (const id of seats) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }
  const items: SummaryItem[] = [];
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  for (const row of rows) {
    const columns = (byRow.get(row) ?? []).slice().sort((a, b) => a - b);
    const price = priceForRow(row);
    if (isCouchRow(row)) {
      for (let i = 0; i < columns.length; i += 2) {
        const columnStart = columns[i];
        const columnEnd = columns[i + 1];
        items.push({
          row,
          column: columnStart,
          isCouch: true,
          columnStart,
          columnEnd,
          seatIds: [seatId(row, columnStart), seatId(row, columnEnd)],
          price,
        });
      }
    } else {
      for (const column of columns) {
        items.push({
          row,
          column,
          isCouch: false,
          columnStart: column,
          columnEnd: column,
          seatIds: [seatId(row, column)],
          price,
        });
      }
    }
  }
  return items;
}

export interface LegendItem {
  state: SeatState;
  label: string;
  color: string;
}

export const LEGEND_ITEMS: LegendItem[] = [
  { state: 'available', label: 'Available', color: '#2E7D32' },
  { state: 'selected', label: 'Selected', color: '#F9A825' },
  { state: 'unavailable', label: 'Unavailable', color: '#C62828' },
  { state: 'accessible', label: 'Accessible', color: '#1565C0' },
];

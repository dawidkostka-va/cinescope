export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatCell {
  kind: 'seat';
  row: number;
  column: number;
  id: string;
  accessible: boolean;
}

export interface CouchCell {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  ids: [string, string];
}

export interface EmptyCell {
  kind: 'empty';
}

export type Cell = SeatCell | CouchCell | EmptyCell;

export interface SeatRow {
  row: number;
  block1: Cell[];
  block2: Cell[];
  block3: Cell[];
}

export const COUCH_PRICE = 89;

export const STATE_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const match = /^R(\d+)C(\d+)$/.exec(id);
  if (!match) return { row: 0, column: 0 };
  return { row: Number(match[1]), column: Number(match[2]) };
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

function seat(row: number, column: number): SeatCell {
  const accessible = row === 1 && column >= 10 && column <= 15;
  return { kind: 'seat', row, column, id: seatId(row, column), accessible };
}

function couch(row: number, columnStart: number): CouchCell {
  const columnEnd = columnStart + 1;
  return {
    kind: 'couch',
    row,
    columnStart,
    columnEnd,
    ids: [seatId(row, columnStart), seatId(row, columnEnd)],
  };
}

export function buildAuditorium(): SeatRow[] {
  const rows: SeatRow[] = [];
  for (let row = 1; row <= 15; row++) {
    if (row === 15) {
      rows.push({
        row,
        block1: [couch(row, 1), couch(row, 3)],
        block2: [5, 7, 9, 11, 13, 15, 17, 19].map((c) => couch(row, c)),
        block3: [couch(row, 21), couch(row, 23)],
      });
      continue;
    }
    rows.push({
      row,
      block1: row <= 10 ? range(1, 4).map((): EmptyCell => ({ kind: 'empty' })) : range(1, 4).map((c) => seat(row, c)),
      block2: range(5, 20).map((c) => seat(row, c)),
      block3: range(21, 24).map((c) => seat(row, c)),
    });
  }
  return rows;
}

export function cellState(cell: SeatCell | CouchCell, occupied: ReadonlySet<string>, selected: ReadonlySet<string>): SeatState {
  const ids = cell.kind === 'seat' ? [cell.id] : cell.ids;
  const isOccupied = ids.some((id) => occupied.has(id));
  const isSelected = ids.some((id) => selected.has(id));
  if (isSelected) return 'selected';
  if (isOccupied) return 'unavailable';
  if (cell.kind === 'seat' && cell.accessible) return 'accessible';
  return 'available';
}

export function priceForCell(cell: SeatCell | CouchCell): number {
  return cell.kind === 'couch' ? COUCH_PRICE : seatPrice(cell.row);
}

export interface SelectionRow {
  row: number;
  text: string;
}

export interface SelectionSummary {
  count: number;
  rows: SelectionRow[];
}

export function summarizeSelection(ids: string[]): SelectionSummary {
  const byRow = new Map<number, number[]>();
  for (const id of ids) {
    const { row, column } = parseSeatId(id);
    const columns = byRow.get(row) ?? [];
    columns.push(column);
    byRow.set(row, columns);
  }
  const rows = Array.from(byRow.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([row, columns]): SelectionRow => {
      if (row === 15) {
        const pairs = new Set<number>();
        for (const col of columns) {
          pairs.add(col % 2 === 1 ? col : col - 1);
        }
        const text = Array.from(pairs)
          .sort((a, b) => a - b)
          .map((start) => `${start}-${start + 1}`)
          .join(', ');
        return { row, text };
      }
      const text = [...columns].sort((a, b) => a - b).join(', ');
      return { row, text };
    });
  return { count: ids.length, rows };
}

export interface TicketItem {
  key: string;
  row: number;
  sortColumn: number;
  seatLabel: string;
  price: number;
  ids: string[];
}

export function buildTickets(selectedIds: string[]): TicketItem[] {
  const items: TicketItem[] = [];
  const row15Columns = new Set<number>();
  for (const id of selectedIds) {
    const { row, column } = parseSeatId(id);
    if (row === 15) {
      row15Columns.add(column);
    } else {
      items.push({ key: id, row, sortColumn: column, seatLabel: String(column), price: seatPrice(row), ids: [id] });
    }
  }
  const pairStarts = new Set<number>();
  for (const col of row15Columns) {
    pairStarts.add(col % 2 === 1 ? col : col - 1);
  }
  for (const start of pairStarts) {
    const end = start + 1;
    items.push({
      key: `R15C${start}-${end}`,
      row: 15,
      sortColumn: start,
      seatLabel: `Couch ${start}-${end}`,
      price: COUCH_PRICE,
      ids: [seatId(15, start), seatId(15, end)],
    });
  }
  return items.sort((a, b) => a.row - b.row || a.sortColumn - b.sortColumn);
}

export const ROWS = 15;
export const MAX_SEATS = 10;

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatItem {
  row: number;
  start: number;
  end: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export type Cell =
  | { kind: 'gap'; key: string }
  | { kind: 'aisle'; key: string }
  | { kind: 'seat'; key: string; row: number; col: number; ids: string[]; accessible: boolean }
  | { kind: 'couch'; key: string; row: number; start: number; end: number; ids: string[] };

export interface RowModel {
  row: number;
  cells: Cell[];
}

export const seatId = (row: number, col: number) => `R${row}C${col}`;

export function priceOf(row: number, couch: boolean): number {
  if (couch) return 89;
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const formatPrice = (n: number) => `${n.toFixed(2)} PLN`;

function buildRow(row: number): RowModel {
  const cells: Cell[] = [];
  const addCols = (from: number, to: number) => {
    if (row === ROWS) {
      for (let c = from; c < to + 1; c += 2) {
        cells.push({ kind: 'couch', key: `c${row}-${c}`, row, start: c, end: c + 1, ids: [seatId(row, c), seatId(row, c + 1)] });
      }
    } else {
      for (let c = from; c <= to; c++) {
        cells.push({
          kind: 'seat',
          key: `s${row}-${c}`,
          row,
          col: c,
          ids: [seatId(row, c)],
          accessible: row === 1 && c >= 10 && c <= 15,
        });
      }
    }
  };
  if (row <= 10) cells.push({ kind: 'gap', key: `g${row}` });
  else addCols(1, 4);
  cells.push({ kind: 'aisle', key: `a1-${row}` });
  addCols(5, 20);
  cells.push({ kind: 'aisle', key: `a2-${row}` });
  addCols(21, 24);
  return { row, cells };
}

export const AUDITORIUM: RowModel[] = Array.from({ length: ROWS }, (_, i) => buildRow(i + 1));

export function itemsFromIds(ids: string[]): SeatItem[] {
  const parsed = ids
    .map((id) => /^R(\d+)C(\d+)$/.exec(id))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ row: +m[1], col: +m[2] }));
  const items = new Map<string, SeatItem>();
  for (const { row, col } of parsed) {
    if (row === ROWS) {
      const start = col % 2 === 1 ? col : col - 1;
      items.set(`${row}-${start}`, {
        row,
        start,
        end: start + 1,
        couch: true,
        ids: [seatId(row, start), seatId(row, start + 1)],
        price: priceOf(row, true),
      });
    } else {
      items.set(`${row}-${col}`, { row, start: col, end: col, couch: false, ids: [seatId(row, col)], price: priceOf(row, false) });
    }
  }
  return [...items.values()].sort((a, b) => a.row - b.row || a.start - b.start);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const weekdayName = (d: Date) => WEEKDAYS[d.getDay()];

export function toIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return toIso(d) === iso ? d : null;
}

export function formatShowDate(date: string, time: string): string {
  const d = parseIso(date);
  if (!d) return `${date} ${time}`;
  return `${weekdayName(d)} ${d.getDate()} ${MONTHS[d.getMonth()]} ${time}`;
}

export interface TicketItem {
  kind: 'seat' | 'couch';
  row: number;
  colStart: number;
  colEnd: number;
  ids: string[];
  price: number;
}

export const MAX_SEATS = 10;
export const COUCH_ROW = 15;

export const seatId = (row: number, col: number) => `R${row}C${col}`;

export function parseSeatId(id: string): { row: number; col: number } | null {
  const m = /^R(\d+)C(\d+)$/.exec(id);
  return m ? { row: Number(m[1]), col: Number(m[2]) } : null;
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function buildItems(ids: string[]): TicketItem[] {
  const seen = new Set<string>();
  const items: TicketItem[] = [];
  for (const id of ids) {
    const p = parseSeatId(id);
    if (!p) continue;
    if (p.row === COUCH_ROW) {
      const start = p.col % 2 === 1 ? p.col : p.col - 1;
      const key = seatId(p.row, start);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        kind: 'couch',
        row: p.row,
        colStart: start,
        colEnd: start + 1,
        ids: [key, seatId(p.row, start + 1)],
        price: 89,
      });
    } else {
      if (seen.has(id)) continue;
      seen.add(id);
      items.push({ kind: 'seat', row: p.row, colStart: p.col, colEnd: p.col, ids: [id], price: seatPrice(p.row) });
    }
  }
  return items.sort((a, b) => a.row - b.row || a.colStart - b.colStart);
}

export function describeItem(item: TicketItem): string {
  return item.kind === 'couch' ? `${item.colStart}-${item.colEnd}` : String(item.colStart);
}

export const COUCH_ROW = 15;
export const COUCH_PRICE = 89;

export interface Ticket {
  row: number;
  isCouch: boolean;
  ids: string[];
  seatLabel: string;
  columnsLabel: string;
  price: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function parseSeatId(id: string): { row: number; column: number } {
  const [, row, column] = /^R(\d+)C(\d+)$/.exec(id) ?? [];
  return { row: Number(row), column: Number(column) };
}

export function seatPrice(row: number): number {
  if (row <= 5) {
    return 25;
  }
  return row <= 10 ? 32 : 39;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export function ticketsFor(ids: readonly string[]): Ticket[] {
  const parsed = ids
    .map((id) => parseSeatId(id))
    .sort((a, b) => a.row - b.row || a.column - b.column);
  const tickets: Ticket[] = [];
  const seen = new Set<string>();

  for (const { row, column } of parsed) {
    const id = seatId(row, column);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    if (row === COUCH_ROW) {
      const partnerColumn = column % 2 === 1 ? column + 1 : column - 1;
      const partner = seatId(row, partnerColumn);
      const start = Math.min(column, partnerColumn);
      const end = start + 1;
      seen.add(partner);
      tickets.push({
        row,
        isCouch: true,
        ids: [seatId(row, start), seatId(row, end)],
        seatLabel: `Couch ${start}-${end}`,
        columnsLabel: `${start}-${end}`,
        price: COUCH_PRICE,
      });
    } else {
      tickets.push({
        row,
        isCouch: false,
        ids: [id],
        seatLabel: String(column),
        columnsLabel: String(column),
        price: seatPrice(row),
      });
    }
  }
  return tickets;
}

import { Cell } from './seat-map/auditorium';

export function priceOf(cell: Cell): number {
  if (cell.kind === 'couch') return 89;
  if (cell.row <= 5) return 25;
  if (cell.row <= 10) return 32;
  return 39;
}

export function formatPln(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

import { bookedCells, Cell } from '../seat-selection/auditorium';

export function priceOf(cell: Cell): number {
  if (cell.kind === 'couch') {
    return 89;
  }
  if (cell.row <= 5) {
    return 25;
  }
  if (cell.row <= 10) {
    return 32;
  }
  return 39;
}

export function totalPriceOf(seats: readonly string[]): number {
  return bookedCells(seats).reduce((total, cell) => total + priceOf(cell), 0);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

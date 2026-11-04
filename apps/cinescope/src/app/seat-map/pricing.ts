import { selectionUnits, SelectionUnit } from './selection';

export function unitPrice(unit: SelectionUnit): number {
  if (unit.row === 15) {
    return 89;
  }
  if (unit.row <= 5) {
    return 25;
  }
  if (unit.row <= 10) {
    return 32;
  }
  return 39;
}

export function bookingTotal(seats: readonly string[]): number {
  return selectionUnits(new Set(seats)).reduce((sum, unit) => sum + unitPrice(unit), 0);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

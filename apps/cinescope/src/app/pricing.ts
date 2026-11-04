import type { SelectedUnit } from './booking.service';

export function unitPrice(unit: SelectedUnit): number {
  if (unit.couch) {
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

export function totalOf(units: SelectedUnit[]): number {
  return units.reduce((sum, unit) => sum + unitPrice(unit), 0);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

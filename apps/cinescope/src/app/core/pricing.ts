import { SeatUnit } from './seat-units';

export function unitPrice(unit: SeatUnit): number {
  if (unit.couch) {
    return 89;
  }
  if (unit.row <= 5) {
    return 25;
  }
  return unit.row <= 10 ? 32 : 39;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

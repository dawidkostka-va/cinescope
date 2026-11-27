import { SelectedUnit } from './booking';

/** Section 5.4: price of one seat by row, and of one couch (two seats). */
const COUCH_PRICE = 89;

/** Price in PLN of one selected seat or couch. */
export function priceOf(unit: SelectedUnit): number {
  if (unit.start !== unit.end) {
    return COUCH_PRICE;
  }
  if (unit.row <= 5) {
    return 25;
  }
  if (unit.row <= 10) {
    return 32;
  }
  return 39;
}

/** Two decimals and the `PLN` suffix, e.g. `25.00 PLN`. */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export const COUCH_PRICE = 89;

/** Price of one seat by row (section 5.4). */
export function seatPrice(row: number): number {
  if (row <= 5) {
    return 25;
  }
  if (row <= 10) {
    return 32;
  }
  return 39;
}

/** Prices are always printed with two decimals and the `PLN` suffix. */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

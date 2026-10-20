export const COUCH_PRICE = 89;

/** Price of a single seat in the given row (not valid for the couch row). */
export function getSeatPrice(row: number): number {
  if (row >= 1 && row <= 5) {
    return 25;
  }
  if (row >= 6 && row <= 10) {
    return 32;
  }
  if (row >= 11 && row <= 14) {
    return 39;
  }
  throw new Error(`Row ${row} has no per-seat price`);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

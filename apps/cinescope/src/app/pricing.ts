import { BookedSeat } from './booking';

const COUCH_PRICE = 89;

/** Price of one seat or couch in PLN (section 5.4). A couch is priced as a whole. */
export function priceOf(seat: BookedSeat): number {
  if (seat.kind === 'couch') {
    return COUCH_PRICE;
  }
  if (seat.row <= 5) {
    return 25;
  }
  if (seat.row <= 10) {
    return 32;
  }
  return 39;
}

/** Formats an amount in PLN with two decimals, e.g. `25.00 PLN`. */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

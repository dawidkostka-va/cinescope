import { Cell } from './auditorium';

const COUCH_PRICE = 89;
const FRONT_PRICE = 25;
const MIDDLE_PRICE = 32;
const BACK_PRICE = 39;

export function priceOf(cell: Cell): number {
  if (cell.kind === 'couch') {
    return COUCH_PRICE;
  }
  if (cell.row <= 5) {
    return FRONT_PRICE;
  }
  return cell.row <= 10 ? MIDDLE_PRICE : BACK_PRICE;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

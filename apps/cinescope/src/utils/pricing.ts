import { SelectionItem } from './seats';

export const COUCH_PRICE = 89;

export function priceForRow(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function priceForItem(item: SelectionItem): number {
  return item.kind === 'couch' ? COUCH_PRICE : priceForRow(item.row);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

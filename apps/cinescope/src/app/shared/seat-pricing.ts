export function priceForRow(row: number): number {
  if (row <= 5) {
    return 25;
  }
  if (row <= 10) {
    return 32;
  }
  if (row <= 14) {
    return 39;
  }
  return 89;
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

import { BookedSeat } from './booking';
import { formatPrice, priceOf } from './pricing';

const seat = (row: number, column: number): BookedSeat => ({ kind: 'seat', row, column, columnEnd: column });

describe('priceOf', () => {
  it('charges 25.00 PLN in rows 1-5, including the accessible seats of row 1', () => {
    expect(priceOf(seat(1, 1))).toBe(25);
    expect(priceOf(seat(1, 12))).toBe(25);
    expect(priceOf(seat(5, 20))).toBe(25);
  });

  it('charges 32.00 PLN in rows 6-10', () => {
    expect(priceOf(seat(6, 5))).toBe(32);
    expect(priceOf(seat(10, 24))).toBe(32);
  });

  it('charges 39.00 PLN in rows 11-14', () => {
    expect(priceOf(seat(11, 1))).toBe(39);
    expect(priceOf(seat(14, 24))).toBe(39);
  });

  it('charges 89.00 PLN per couch, not per seat', () => {
    expect(priceOf({ kind: 'couch', row: 15, column: 1, columnEnd: 2 })).toBe(89);
  });
});

describe('formatPrice', () => {
  it('prints two decimals and the PLN suffix', () => {
    expect(formatPrice(25)).toBe('25.00 PLN');
    expect(formatPrice(146)).toBe('146.00 PLN');
  });
});

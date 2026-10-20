import { describe, expect, it } from 'vitest';
import { formatPrice, isAccessibleSeat, parseSeatId, priceForRow, seatId } from './seat.util';

describe('seat.util', () => {
  it('builds and parses seat identifiers', () => {
    expect(seatId(7, 12)).toBe('R7C12');
    expect(parseSeatId('R15C5')).toEqual({ row: 15, column: 5 });
  });

  it('prices rows per the spec table', () => {
    expect(priceForRow(1)).toBe(25);
    expect(priceForRow(5)).toBe(25);
    expect(priceForRow(6)).toBe(32);
    expect(priceForRow(10)).toBe(32);
    expect(priceForRow(11)).toBe(39);
    expect(priceForRow(14)).toBe(39);
    expect(priceForRow(15)).toBe(89);
  });

  it('formats prices with two decimals and PLN suffix', () => {
    expect(formatPrice(25)).toBe('25.00 PLN');
    expect(formatPrice(121)).toBe('121.00 PLN');
  });

  it('marks only row 1 columns 10-15 as accessible', () => {
    expect(isAccessibleSeat(1, 10)).toBe(true);
    expect(isAccessibleSeat(1, 15)).toBe(true);
    expect(isAccessibleSeat(1, 9)).toBe(false);
    expect(isAccessibleSeat(1, 16)).toBe(false);
    expect(isAccessibleSeat(2, 12)).toBe(false);
  });
});

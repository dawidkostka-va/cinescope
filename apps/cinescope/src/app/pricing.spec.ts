import { formatPrice, unitPrice } from './pricing';

describe('pricing', () => {
  it('prices seats by row band', () => {
    expect(unitPrice({ row: 1, column: 11, couch: false })).toBe(25);
    expect(unitPrice({ row: 5, column: 1, couch: false })).toBe(25);
    expect(unitPrice({ row: 6, column: 1, couch: false })).toBe(32);
    expect(unitPrice({ row: 10, column: 1, couch: false })).toBe(32);
    expect(unitPrice({ row: 11, column: 1, couch: false })).toBe(39);
    expect(unitPrice({ row: 14, column: 1, couch: false })).toBe(39);
  });

  it('prices a couch per couch, not per seat', () => {
    expect(unitPrice({ row: 15, column: 3, couch: true })).toBe(89);
  });

  it('prints two decimals with the PLN suffix', () => {
    expect(formatPrice(25)).toBe('25.00 PLN');
    expect(formatPrice(121)).toBe('121.00 PLN');
  });
});

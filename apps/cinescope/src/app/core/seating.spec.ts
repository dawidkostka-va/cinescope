import { buildItems, formatPrice, formatShowDate, parseIsoDate, seatPrice } from './seating';

describe('seating', () => {
  it('prices rows', () => {
    expect([1, 5, 6, 10, 11, 14].map(seatPrice)).toEqual([25, 25, 32, 32, 39, 39]);
    expect(formatPrice(25)).toBe('25.00 PLN');
  });

  it('groups couch identifiers and sorts items', () => {
    const items = buildItems(['R15C4', 'R15C3', 'R7C12', 'R7C11', 'R1C10']);
    expect(items.map((i) => [i.row, i.colStart, i.colEnd, i.price])).toEqual([
      [1, 10, 10, 25],
      [7, 11, 11, 32],
      [7, 12, 12, 32],
      [15, 3, 4, 89],
    ]);
  });

  it('formats show dates and validates ISO dates', () => {
    expect(formatShowDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('nope')).toBeNull();
    expect(parseIsoDate('2026-09-15')).not.toBeNull();
  });
});

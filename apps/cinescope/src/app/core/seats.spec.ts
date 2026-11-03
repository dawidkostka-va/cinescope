import { AUDITORIUM, bookingItems, formatPrice, priceOf } from './seats';

describe('seats', () => {
  it('lays out 296 seats and 12 couches', () => {
    const cells = AUDITORIUM.flatMap((row) => row.blocks.flatMap((block) => block ?? []));
    expect(cells.filter((cell) => !cell.couch)).toHaveLength(296);
    expect(cells.filter((cell) => cell.couch)).toHaveLength(12);
    expect(cells.filter((cell) => cell.accessible).map((cell) => cell.columnStart)).toEqual([10, 11, 12, 13, 14, 15]);
  });

  it('has no left block in rows 1-10', () => {
    for (const row of AUDITORIUM) {
      expect(row.blocks[0] === null).toBe(row.row <= 10);
    }
  });

  it('prices rows and couches', () => {
    expect([1, 5, 6, 10, 11, 14].map((row) => priceOf(row, false))).toEqual([25, 25, 32, 32, 39, 39]);
    expect(priceOf(15, true)).toBe(89);
    expect(formatPrice(121)).toBe('121.00 PLN');
  });

  it('groups couch ids and orders items by row and column', () => {
    const items = bookingItems(['R15C4', 'R15C3', 'R7C12', 'R1C10']);
    expect(items.map((item) => [item.row, item.columnStart, item.columnEnd, item.couch, item.price])).toEqual([
      [1, 10, 10, false, 25],
      [7, 12, 12, false, 32],
      [15, 3, 4, true, 89],
    ]);
  });
});

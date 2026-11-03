import { AUDITORIUM, itemsFromIds, priceOf } from './seat-layout';

describe('seat layout', () => {
  const all = AUDITORIUM.flatMap((r) => [...r.left, ...r.middle, ...r.right]);

  it('has 308 selectable elements: 296 seats and 12 couches', () => {
    expect(all.length).toBe(308);
    expect(all.filter((i) => i.couch).length).toBe(12);
    expect(all.filter((i) => !i.couch).length).toBe(296);
  });

  it('leaves the entrance empty in rows 1-10', () => {
    for (const row of AUDITORIUM) expect(row.left.length).toBe(row.row <= 10 ? 0 : row.row === 15 ? 2 : 4);
    expect(AUDITORIUM[0].middle[0].colStart).toBe(5);
  });

  it('marks 6 accessible seats in row 1', () => {
    const acc = all.filter((i) => i.accessible);
    expect(acc.map((i) => `${i.row}:${i.colStart}`)).toEqual(['1:10', '1:11', '1:12', '1:13', '1:14', '1:15']);
  });

  it('prices seats and couches', () => {
    expect([priceOf(1, false), priceOf(5, false), priceOf(6, false), priceOf(10, false)]).toEqual([25, 25, 32, 32]);
    expect([priceOf(11, false), priceOf(14, false), priceOf(15, true)]).toEqual([39, 39, 89]);
  });

  it('groups couch identifiers into one item', () => {
    const items = itemsFromIds(['R15C6', 'R15C5', 'R7C12']);
    expect(items.map((i) => [i.row, i.colStart, i.colEnd])).toEqual([
      [7, 12, 12],
      [15, 5, 6],
    ]);
  });
});

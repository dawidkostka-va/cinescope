import { LAYOUT, cellState, formatPrice, itemsTotal, ticketItems } from './seats';

describe('seat layout', () => {
  const cells = LAYOUT.flatMap((r) => [...r.left, ...r.middle, ...r.right]);

  it('has 308 selectable elements and 12 couches', () => {
    expect(cells.length).toBe(308);
    expect(cells.filter((c) => c.kind === 'couch').length).toBe(12);
  });

  it('starts rows 1-10 at column 5', () => {
    for (const row of LAYOUT.slice(0, 10)) {
      expect(row.left.length).toBe(0);
      expect(row.middle[0]).toMatchObject({ column: 5 });
    }
  });

  it('marks accessible seats and occupied couches', () => {
    const none = new Set<string>();
    const accessible = cells.filter((c) => cellState(c, none, none) === 'accessible');
    expect(accessible.length).toBe(6);
    const couch = cells.find((c) => c.kind === 'couch')!;
    expect(cellState(couch, none, new Set(['R15C2']))).toBe('unavailable');
  });
});

describe('tickets', () => {
  it('prices seats and couches', () => {
    const items = ticketItems(['R15C2', 'R15C1', 'R7C12', 'R1C10', 'R12C3']);
    expect(items.map((i) => i.price)).toEqual([25, 32, 39, 89]);
    expect(items[3].ids).toEqual(['R15C1', 'R15C2']);
    expect(formatPrice(itemsTotal(items))).toBe('185.00 PLN');
  });
});

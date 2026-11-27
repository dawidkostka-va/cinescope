import { ticketsFor } from './booking';
import { formatPrice, seatPrice } from './pricing';

describe('ticketsFor', () => {
  it('lists seats and couches ordered by row and then by column', () => {
    const items = ticketsFor(['R15C3', 'R15C4', 'R7C12', 'R15C1', 'R15C2', 'R7C11', 'R1C10']);
    expect(items.map((item) => [item.row, item.seat])).toEqual([
      [1, '10'],
      [7, '11'],
      [7, '12'],
      [15, 'Couch 1-2'],
      [15, 'Couch 3-4'],
    ]);
  });

  it('describes a couch by both columns and lists its two identifiers', () => {
    const [couch] = ticketsFor(['R15C5', 'R15C6']);
    expect(couch.seat).toBe('Couch 5-6');
    expect(couch.seatIds).toEqual(['R15C5', 'R15C6']);
  });

  it('prices seats by row and a couch as one unit', () => {
    const items = ticketsFor(['R3C7', 'R8C7', 'R12C7', 'R15C1', 'R15C2']);
    expect(items.map((item) => item.price)).toEqual([25, 32, 39, 89]);
  });

  it('prices the accessible seats of row 1 like the rest of rows 1 to 5', () => {
    expect(ticketsFor(['R1C10'])[0].price).toBe(25);
    expect(seatPrice(5)).toBe(25);
  });

  it('prints prices with two decimals and the PLN suffix', () => {
    expect(formatPrice(25)).toBe('25.00 PLN');
    expect(formatPrice(121)).toBe('121.00 PLN');
  });
});

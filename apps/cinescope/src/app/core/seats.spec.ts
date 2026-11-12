import { describeSeat, describeShort, pln, priceOf, seatIds, totalPrice, totalSeats } from './seats';

describe('seats', () => {
  it('prices rows and couches', () => {
    expect(priceOf('R1C10')).toBe(25);
    expect(priceOf('R5C5')).toBe(25);
    expect(priceOf('R6C5')).toBe(32);
    expect(priceOf('R10C20')).toBe(32);
    expect(priceOf('R11C1')).toBe(39);
    expect(priceOf('R14C24')).toBe(39);
    expect(priceOf('R15C3')).toBe(89);
    expect(pln(totalPrice(['R7C12', 'R15C1', 'R15C3']))).toBe('210.00 PLN');
  });

  it('counts a couch as two seats and expands its identifiers', () => {
    expect(totalSeats(['R7C12', 'R15C1'])).toBe(3);
    expect(seatIds('R15C5')).toEqual(['R15C5', 'R15C6']);
    expect(seatIds('R7C12')).toEqual(['R7C12']);
  });

  it('describes seats', () => {
    expect(describeSeat('R15C3')).toBe('Couch 3-4');
    expect(describeSeat('R7C12')).toBe('12');
    expect(describeShort('R15C3')).toBe('3-4');
  });
});

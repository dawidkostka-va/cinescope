import { bookingTotal, toUnits, unitDescription, unitLabel } from './seat-units';
import { unitPrice } from './pricing';

describe('seat units', () => {
  it('groups row 15 identifiers into couches and keeps other seats single', () => {
    const units = toUnits(['R15C3', 'R15C4', 'R7C12', 'R15C1', 'R15C2']);
    expect(units.map((unit) => [unit.row, unit.start, unit.end, unit.couch])).toEqual([
      [7, 12, 12, false],
      [15, 1, 2, true],
      [15, 3, 4, true],
    ]);
  });

  it('describes couches as Couch a-b and seats by column', () => {
    const [seat, couch] = toUnits(['R15C3', 'R15C4', 'R3C12']);
    expect(unitDescription(seat)).toBe('12');
    expect(unitDescription(couch)).toBe('Couch 3-4');
    expect(unitLabel(couch)).toBe('3-4');
  });

  it('prices seats by row band and couches per couch', () => {
    const price = (ids: string[]) => toUnits(ids).map(unitPrice);
    expect(price(['R1C10', 'R5C1'])).toEqual([25, 25]);
    expect(price(['R6C1', 'R10C1'])).toEqual([32, 32]);
    expect(price(['R11C1', 'R14C24'])).toEqual([39, 39]);
    expect(price(['R15C1', 'R15C2'])).toEqual([89]);
    expect(bookingTotal(['R15C1', 'R15C2', 'R11C1'], unitPrice)).toBe(128);
  });
});

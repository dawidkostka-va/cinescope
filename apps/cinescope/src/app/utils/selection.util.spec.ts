import { describe, expect, it } from 'vitest';
import { groupIntoUnits, unitSeatLabel } from './selection.util';

describe('selection.util', () => {
  it('groups regular seats individually, ordered by row then column', () => {
    const units = groupIntoUnits(['R7C12', 'R7C11', 'R3C1']);
    expect(units.map((u) => [u.row, u.columns[0]])).toEqual([
      [3, 1],
      [7, 11],
      [7, 12],
    ]);
  });

  it('groups a couch pair into a single unit priced at 89', () => {
    const units = groupIntoUnits(['R15C1', 'R15C2']);
    expect(units).toHaveLength(1);
    expect(units[0].isCouch).toBe(true);
    expect(units[0].price).toBe(89);
    expect(unitSeatLabel(units[0])).toBe('Couch 1-2');
  });

  it('labels a regular seat by its column number', () => {
    const [unit] = groupIntoUnits(['R7C12']);
    expect(unitSeatLabel(unit)).toBe('12');
  });
});

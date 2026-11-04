import { describeSelection } from './selection';
import { bookingTotal } from './pricing';

describe('selection', () => {
  it('describes seats by row with couches as ranges', () => {
    const lines = describeSelection(new Set(['R7C12', 'R7C11', 'R15C3', 'R15C4']));
    expect(lines).toEqual([
      { row: 7, seats: '11, 12' },
      { row: 15, seats: '3-4' },
    ]);
  });

  it('prices seats by row band and couches at 89 PLN', () => {
    expect(bookingTotal(['R1C10', 'R7C12', 'R12C1', 'R15C1', 'R15C2'])).toBe(25 + 32 + 39 + 89);
  });
});

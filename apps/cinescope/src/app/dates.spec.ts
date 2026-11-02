import { parseIsoDate, showDate, toIsoDate } from './dates';

describe('dates', () => {
  it('parses valid ISO dates and rejects impossible ones', () => {
    expect(parseIsoDate('2026-09-15')).not.toBeNull();
    expect(toIsoDate(parseIsoDate('2026-09-15')!)).toBe('2026-09-15');
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('15.09.2026')).toBeNull();
    expect(parseIsoDate(null)).toBeNull();
  });

  it('formats a screening as weekday, day, month and time', () => {
    expect(showDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
  });
});

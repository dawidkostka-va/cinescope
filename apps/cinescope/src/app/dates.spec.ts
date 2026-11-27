import { formatShowDate, parseIsoDate } from './dates';

describe('formatShowDate', () => {
  it('formats the show date as weekday, day, month and time', () => {
    expect(formatShowDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
  });

  it('does not pad the day with a leading zero', () => {
    expect(formatShowDate('2026-09-01', '09:05')).toBe('Tuesday 1 Sep 09:05');
  });

  it('parses strict ISO dates only', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-9-15')).toBeNull();
  });
});

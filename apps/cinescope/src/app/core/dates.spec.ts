import { parseIsoDate, showDate, toIsoDate } from './dates';

describe('dates', () => {
  it('parses only real ISO dates', () => {
    expect(parseIsoDate('2026-09-15')).not.toBeNull();
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('15-09-2026')).toBeNull();
    expect(parseIsoDate(null)).toBeNull();
  });

  it('formats the show date as weekday, day without zero, three-letter month and time', () => {
    expect(showDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
    expect(showDate('2026-09-05', '19:30')).toBe('Saturday 5 Sep 19:30');
  });

  it('round-trips ISO dates', () => {
    expect(toIsoDate(parseIsoDate('2026-01-09')!)).toBe('2026-01-09');
  });
});

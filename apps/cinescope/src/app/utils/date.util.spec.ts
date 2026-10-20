import { describe, expect, it } from 'vitest';
import { formatShowDate, isValidIsoDate, toIsoDate } from './date.util';

describe('date.util', () => {
  it('formats a show date as "<Weekday> <D> <Mon> <HH:mm>"', () => {
    expect(formatShowDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
  });

  it('validates ISO dates strictly', () => {
    expect(isValidIsoDate('2026-09-15')).toBe(true);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('not-a-date')).toBe(false);
    expect(isValidIsoDate('2026-9-15')).toBe(false);
  });

  it('round-trips toIsoDate', () => {
    expect(toIsoDate(new Date(2026, 8, 15))).toBe('2026-09-15');
  });
});

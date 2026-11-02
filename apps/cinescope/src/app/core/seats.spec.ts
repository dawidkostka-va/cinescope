import { formatPrice, gridColumn, ticketsFromSeats } from './seats';
import { parseIso, showDate } from './dates';
import { validate } from '../checkout/validation';

describe('seats', () => {
  it('prices seats and couches', () => {
    const t = ticketsFromSeats(['R15C3', 'R15C4', 'R1C10', 'R7C12', 'R11C1', 'R15C1', 'R15C2']);
    expect(t.map((x) => [x.row, x.start, x.couch, x.price])).toEqual([
      [1, 10, false, 25],
      [7, 12, false, 32],
      [11, 1, false, 39],
      [15, 1, true, 89],
      [15, 3, true, 89],
    ]);
    expect(formatPrice(121)).toBe('121.00 PLN');
  });

  it('maps columns around the aisles', () => {
    expect([gridColumn(4), gridColumn(5), gridColumn(20), gridColumn(21), gridColumn(24)]).toEqual([5, 7, 22, 24, 27]);
  });
});

describe('dates', () => {
  it('formats the show date', () => {
    expect(showDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
  });

  it('rejects invalid ISO dates', () => {
    expect(parseIso('2026-02-30')).toBeNull();
    expect(parseIso('2026-9-15')).toBeNull();
    expect(parseIso('2026-09-15')).not.toBeNull();
  });
});

describe('checkout validation', () => {
  const ok = { firstName: 'An', lastName: 'Ko', email: 'a@b.c', confirmEmail: 'a@b.c', phone: '', terms: true };

  it('accepts a valid form', () => {
    expect(Object.values(validate(ok)).every((e) => e === null)).toBe(true);
  });

  it('validates emails', () => {
    for (const bad of ['not-an-email', 'a@b', 'a@.com', 'a b@c.d']) {
      expect(validate({ ...ok, email: bad, confirmEmail: bad }).email).toBe('Enter a valid email address');
    }
  });

  it('reports required, mismatch and phone messages', () => {
    const e = validate({ ...ok, firstName: '', confirmEmail: 'x', phone: '12345678', terms: false });
    expect(e.firstName).toBe('First name is required');
    expect(e.confirmEmail).toBe('Email addresses do not match');
    expect(e.phone).toBe('Phone number must be exactly 9 digits');
    expect(e.terms).toBe('You must accept the terms and conditions');
  });
});

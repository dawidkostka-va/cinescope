import { describe, expect, it } from 'vitest';
import { buildAuditorium } from './seat-map/auditorium';
import { ticketsFor, formatPrice } from './booking/tickets';
import { validateCheckout } from './checkout/checkout.validation';
import { parseIsoDate, showDate } from './dates';
import { CheckoutValues } from './booking/booking.store';

const valid: CheckoutValues = {
  firstName: 'An',
  lastName: 'Ko',
  email: 'anna@example.com',
  confirmEmail: 'anna@example.com',
  phone: '',
  terms: true,
};

describe('auditorium', () => {
  it('has 308 selectable elements with 12 couches and 6 accessible seats', () => {
    const items = buildAuditorium().flatMap((row) => row.blocks.flat());
    expect(items.length).toBe(308);
    expect(items.filter((item) => item.kind === 'couch').length).toBe(12);
    expect(items.filter((item) => item.kind === 'seat' && item.accessible).length).toBe(6);
  });
});

describe('tickets and prices', () => {
  it('prices by row and groups row 15 pairs into couches', () => {
    const tickets = ticketsFor(['R15C4', 'R15C3', 'R7C12', 'R1C10']);
    expect(tickets.map((t) => t.seatLabel)).toEqual(['10', '12', 'Couch 3-4']);
    expect(tickets.map((t) => t.price)).toEqual([25, 32, 89]);
    expect(formatPrice(146)).toBe('146.00 PLN');
  });
});

describe('checkout validation', () => {
  it('accepts a valid form', () => {
    expect(validateCheckout(valid)).toEqual({});
  });

  it('applies the required, length, email, phone and terms rules', () => {
    const errors = validateCheckout({
      ...valid,
      firstName: '',
      lastName: 'K',
      email: 'a@b',
      confirmEmail: 'x@y.com',
      phone: '12345',
      terms: false,
    });
    expect(errors).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name must be at least 2 characters',
      email: 'Enter a valid email address',
      confirmEmail: 'Email addresses do not match',
      phone: 'Phone number must be exactly 9 digits',
      terms: 'You must accept the terms and conditions',
    });
  });

  it('accepts a 9-digit phone and rejects non-digits', () => {
    expect(validateCheckout({ ...valid, phone: '123456789' })).toEqual({});
    expect(validateCheckout({ ...valid, phone: '12345678a' }).phone).toBeDefined();
  });

  it('rejects malformed addresses', () => {
    for (const email of ['not-an-email', 'a@b', 'a@.com', 'a b@c.com']) {
      expect(validateCheckout({ ...valid, email, confirmEmail: email }).email).toBeDefined();
    }
  });
});

describe('dates', () => {
  it('round-trips ISO dates and rejects invalid ones', () => {
    expect(parseIsoDate('2026-09-15')).toEqual(new Date(2026, 8, 15));
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('15/09/2026')).toBeNull();
  });

  it('formats the show date', () => {
    expect(showDate('2026-09-15', '16:00')).toBe('Tuesday 15 Sep 16:00');
  });
});

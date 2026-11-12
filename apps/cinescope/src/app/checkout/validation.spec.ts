import { EMPTY_FORM } from '../core/booking.service';
import { isValid, validate } from './validation';

const valid = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna@example.com',
  confirmEmail: 'anna@example.com',
  phone: '',
  terms: true,
};

describe('checkout validation', () => {
  it('accepts a valid form with an empty phone', () => {
    expect(isValid(validate(valid))).toBe(true);
  });

  it('reports required and rule messages', () => {
    const e = validate(EMPTY_FORM);
    expect(e.firstName).toBe('First name is required');
    expect(e.confirmEmail).toBe('Confirm email is required');
    expect(e.terms).toBe('You must accept the terms and conditions');
    expect(validate({ ...valid, lastName: 'K' }).lastName).toBe(
      'Last name must be at least 2 characters',
    );
  });

  it('validates emails', () => {
    for (const email of ['not-an-email', 'a@b', 'a@.com', 'a b@c.com']) {
      expect(validate({ ...valid, email }).email).toBe('Enter a valid email address');
    }
    expect(validate({ ...valid, email: 'a@b.c' }).email).toBeNull();
  });

  it('compares confirm email as typed', () => {
    expect(validate({ ...valid, email: 'x', confirmEmail: 'x' }).confirmEmail).toBeNull();
    expect(validate({ ...valid, confirmEmail: 'anna@example.org' }).confirmEmail).toBe(
      'Email addresses do not match',
    );
  });

  it('validates phone', () => {
    expect(validate({ ...valid, phone: '123456789' }).phone).toBeNull();
    for (const phone of ['12345678', '1234567890', '12345678a', ' 23456789']) {
      expect(validate({ ...valid, phone }).phone).toBe('Phone number must be exactly 9 digits');
    }
  });
});

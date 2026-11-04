import { EMPTY_CHECKOUT } from '../booking/booking.service';
import { CheckoutValues } from '../models';
import { validateCheckout } from './checkout.validation';

const valid: CheckoutValues = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna@example.com',
  confirmEmail: 'anna@example.com',
  phone: '',
  terms: true,
};

describe('validateCheckout', () => {
  it('accepts a complete form', () => {
    expect(Object.values(validateCheckout(valid)).every((error) => error === null)).toBe(true);
  });

  it('reports required fields with the label', () => {
    const errors = validateCheckout(EMPTY_CHECKOUT);
    expect(errors.firstName).toBe('First name is required');
    expect(errors.confirmEmail).toBe('Confirm email is required');
    expect(errors.terms).toBe('You must accept the terms and conditions');
  });

  it('requires at least two characters in names', () => {
    expect(validateCheckout({ ...valid, firstName: 'A' }).firstName).toBe('First name must be at least 2 characters');
  });

  it.each(['not-an-email', 'a@b', 'a@.com', 'a b@c.com'])('rejects email %s', (email) => {
    expect(validateCheckout({ ...valid, email, confirmEmail: email }).email).toBe('Enter a valid email address');
  });

  it('compares confirm email with email as typed', () => {
    expect(validateCheckout({ ...valid, confirmEmail: 'Anna@example.com' }).confirmEmail).toBe(
      'Email addresses do not match',
    );
  });

  it('accepts an empty phone and requires exactly nine digits otherwise', () => {
    expect(validateCheckout({ ...valid, phone: '' }).phone).toBeNull();
    expect(validateCheckout({ ...valid, phone: '123456789' }).phone).toBeNull();
    expect(validateCheckout({ ...valid, phone: '12345678' }).phone).toBe('Phone number must be exactly 9 digits');
    expect(validateCheckout({ ...valid, phone: '1234567890' }).phone).toBe('Phone number must be exactly 9 digits');
  });
});

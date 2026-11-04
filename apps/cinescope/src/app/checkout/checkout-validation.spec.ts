import { CheckoutForm } from '../booking.service';
import { validateCheckout } from './checkout-validation';

const valid: CheckoutForm = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna@example.com',
  confirmEmail: 'anna@example.com',
  phone: '',
  terms: true,
};

describe('validateCheckout', () => {
  it('accepts a complete form with an empty optional phone', () => {
    expect(Object.values(validateCheckout(valid)).every((m) => m === undefined)).toBe(true);
  });

  it('requires names of at least two characters', () => {
    const errors = validateCheckout({ ...valid, firstName: '', lastName: 'K' });
    expect(errors.firstName).toBe('First name is required');
    expect(errors.lastName).toBe('Last name must be at least 2 characters');
  });

  it('accepts only addresses with a local part, an @ and a dotted domain', () => {
    const message = 'Enter a valid email address';
    expect(validateCheckout({ ...valid, email: 'not-an-email' }).email).toBe(message);
    expect(validateCheckout({ ...valid, email: 'a@b' }).email).toBe(message);
    expect(validateCheckout({ ...valid, email: 'a@.com' }).email).toBe(message);
    expect(validateCheckout({ ...valid, email: 'a b@c.de' }).email).toBe(message);
    expect(validateCheckout({ ...valid, email: 'a@b.c' }).email).toBeUndefined();
    expect(validateCheckout({ ...valid, email: '' }).email).toBe('Email is required');
  });

  it('requires the confirmation to match the email as typed', () => {
    expect(validateCheckout({ ...valid, confirmEmail: '' }).confirmEmail).toBe(
      'Confirm email is required',
    );
    expect(validateCheckout({ ...valid, confirmEmail: 'anna@example.co' }).confirmEmail).toBe(
      'Email addresses do not match',
    );
    expect(
      validateCheckout({ ...valid, email: 'bad', confirmEmail: 'bad' }).confirmEmail,
    ).toBeUndefined();
  });

  it('accepts an empty phone and otherwise requires exactly 9 digits', () => {
    expect(validateCheckout({ ...valid, phone: '' }).phone).toBeUndefined();
    expect(validateCheckout({ ...valid, phone: '123456789' }).phone).toBeUndefined();
    const message = 'Phone number must be exactly 9 digits';
    expect(validateCheckout({ ...valid, phone: '12345678' }).phone).toBe(message);
    expect(validateCheckout({ ...valid, phone: '1234567890' }).phone).toBe(message);
    expect(validateCheckout({ ...valid, phone: '12345678a' }).phone).toBe(message);
    expect(validateCheckout({ ...valid, phone: '123 45678' }).phone).toBe(message);
  });

  it('requires the terms checkbox', () => {
    expect(validateCheckout({ ...valid, terms: false }).terms).toBe(
      'You must accept the terms and conditions',
    );
  });
});

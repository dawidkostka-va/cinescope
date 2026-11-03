import { CheckoutForm } from '../core/booking.service';
import { hasErrors, validateCheckout } from './checkout-validation';

const valid: CheckoutForm = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna@example.com',
  confirmEmail: 'anna@example.com',
  phone: '',
  terms: true,
};

describe('validateCheckout', () => {
  it('accepts a complete form and an empty phone number', () => {
    expect(hasErrors(validateCheckout(valid))).toBe(false);
  });

  it('reports required fields and names', () => {
    const errors = validateCheckout({ ...valid, firstName: '', lastName: '', email: '', confirmEmail: '', terms: false });
    expect(errors).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name is required',
      email: 'Email is required',
      confirmEmail: 'Confirm email is required',
      phone: undefined,
      terms: 'You must accept the terms and conditions',
    });
  });

  it('requires names of at least two characters', () => {
    expect(validateCheckout({ ...valid, firstName: 'A' }).firstName).toBe('First name must be at least 2 characters');
    expect(validateCheckout({ ...valid, lastName: 'B' }).lastName).toBe('Last name must be at least 2 characters');
  });

  it.each(['not-an-email', 'a@b', 'a@.com', 'a b@example.com', 'a@b.'])('rejects the email %s', (email) => {
    expect(validateCheckout({ ...valid, email, confirmEmail: email }).email).toBe('Enter a valid email address');
  });

  it('compares the confirmation with the email as typed', () => {
    expect(validateCheckout({ ...valid, confirmEmail: 'anna@example.com ' }).confirmEmail).toBe(
      'Email addresses do not match',
    );
  });

  it('accepts exactly nine digits as a phone number and nothing else', () => {
    expect(validateCheckout({ ...valid, phone: '123456789' }).phone).toBeUndefined();
    expect(validateCheckout({ ...valid, phone: '12345678' }).phone).toBe('Phone number must be exactly 9 digits');
    expect(validateCheckout({ ...valid, phone: '1234567890' }).phone).toBe('Phone number must be exactly 9 digits');
    expect(validateCheckout({ ...valid, phone: '12345678a' }).phone).toBe('Phone number must be exactly 9 digits');
  });
});

import { CheckoutValues } from '../booking';
import { EMPTY_CHECKOUT, checkoutErrors, isValidCheckout } from './checkout-form';

const valid: CheckoutValues = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna@example.com',
  confirmEmail: 'anna@example.com',
  phone: '',
  termsAccepted: true,
};

describe('checkoutErrors', () => {
  it('accepts a complete form with an empty optional phone', () => {
    expect(isValidCheckout(checkoutErrors(valid))).toBe(true);
  });

  it('reports the required messages for an empty form', () => {
    const errors = checkoutErrors(EMPTY_CHECKOUT);
    expect(errors.firstName).toBe('First name is required');
    expect(errors.lastName).toBe('Last name is required');
    expect(errors.email).toBe('Email is required');
    expect(errors.confirmEmail).toBe('Confirm email is required');
    expect(errors.phone).toBeNull();
    expect(errors.terms).toBe('You must accept the terms and conditions');
  });

  it('requires names of at least 2 characters', () => {
    expect(checkoutErrors({ ...valid, firstName: 'A' }).firstName).toBe('First name must be at least 2 characters');
    expect(checkoutErrors({ ...valid, lastName: 'K' }).lastName).toBe('Last name must be at least 2 characters');
    expect(checkoutErrors({ ...valid, firstName: 'Jo' }).firstName).toBeNull();
  });

  it('does not trim the names before checking them', () => {
    expect(checkoutErrors({ ...valid, firstName: ' A' }).firstName).toBeNull();
    expect(checkoutErrors({ ...valid, firstName: '  ' }).firstName).toBeNull();
  });

  it.each(['not-an-email', 'a@b', 'a@.com', 'a b@example.com', 'a@@example.com', '@example.com'])(
    'rejects the email %s',
    (email) => {
      expect(checkoutErrors({ ...valid, email, confirmEmail: email }).email).toBe('Enter a valid email address');
    },
  );

  it('accepts a minimal valid email address', () => {
    expect(checkoutErrors({ ...valid, email: 'a@b.c', confirmEmail: 'a@b.c' }).email).toBeNull();
  });

  it('requires the confirm email to match the email as typed', () => {
    const errors = checkoutErrors({ ...valid, confirmEmail: 'Anna@example.com' });
    expect(errors.confirmEmail).toBe('Email addresses do not match');
  });

  it('compares the confirm email even when the email itself is invalid', () => {
    const errors = checkoutErrors({ ...valid, email: 'not-an-email', confirmEmail: 'not-an-email' });
    expect(errors.email).toBe('Enter a valid email address');
    expect(errors.confirmEmail).toBeNull();
  });

  it('accepts an empty phone and exactly 9 digits only', () => {
    expect(checkoutErrors({ ...valid, phone: '' }).phone).toBeNull();
    expect(checkoutErrors({ ...valid, phone: '123456789' }).phone).toBeNull();
    for (const phone of ['12345678', '1234567890', '12345 6789', '12345678a', '+123456789']) {
      expect(checkoutErrors({ ...valid, phone }).phone).toBe('Phone number must be exactly 9 digits');
    }
  });

  it('requires the terms checkbox', () => {
    expect(checkoutErrors({ ...valid, termsAccepted: false }).terms).toBe(
      'You must accept the terms and conditions',
    );
  });
});

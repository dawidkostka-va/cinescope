import { CheckoutFormValues, emptyCheckoutForm } from '../booking/types';
import { getCheckoutErrors, isValidEmail } from './validation';

function form(overrides: Partial<CheckoutFormValues>): CheckoutFormValues {
  return { ...emptyCheckoutForm, ...overrides };
}

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('anna@example.com')).toBe(true);
  });
  it.each(['not-an-email', 'a@b', 'a@.com'])('rejects %s', (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe('getCheckoutErrors', () => {
  it('requires first and last name with a minimum length', () => {
    expect(getCheckoutErrors(form({ firstName: '' })).firstName).toBe('First name is required');
    expect(getCheckoutErrors(form({ firstName: 'A' })).firstName).toBe(
      'First name must be at least 2 characters',
    );
    expect(getCheckoutErrors(form({ firstName: 'An' })).firstName).toBeUndefined();
    expect(getCheckoutErrors(form({ lastName: '' })).lastName).toBe('Last name is required');
  });

  it('requires a valid email and a matching confirmation', () => {
    expect(getCheckoutErrors(form({ email: '' })).email).toBe('Email is required');
    expect(getCheckoutErrors(form({ email: 'nope' })).email).toBe('Enter a valid email address');
    expect(getCheckoutErrors(form({ confirmEmail: '' })).confirmEmail).toBe('Confirm email is required');
    expect(
      getCheckoutErrors(form({ email: 'a@b.com', confirmEmail: 'b@b.com' })).confirmEmail,
    ).toBe('Email addresses do not match');
    expect(
      getCheckoutErrors(form({ email: 'a@b.com', confirmEmail: 'a@b.com' })).confirmEmail,
    ).toBeUndefined();
  });

  it('leaves phone optional but validates its format when filled', () => {
    expect(getCheckoutErrors(form({ phone: '' })).phone).toBeUndefined();
    expect(getCheckoutErrors(form({ phone: '12345' })).phone).toBe(
      'Phone number must be exactly 9 digits',
    );
    expect(getCheckoutErrors(form({ phone: '123456789' })).phone).toBeUndefined();
  });

  it('requires the terms checkbox', () => {
    expect(getCheckoutErrors(form({ acceptedTerms: false })).terms).toBe(
      'You must accept the terms and conditions',
    );
    expect(getCheckoutErrors(form({ acceptedTerms: true })).terms).toBeUndefined();
  });

  it('has no errors for a fully valid form', () => {
    const errors = getCheckoutErrors(
      form({
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna@example.com',
        confirmEmail: 'anna@example.com',
        phone: '123456789',
        acceptedTerms: true,
      }),
    );
    expect(errors).toEqual({});
  });
});

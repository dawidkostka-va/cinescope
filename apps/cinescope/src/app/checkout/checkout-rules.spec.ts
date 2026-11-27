import { CheckoutValues, EMPTY_CHECKOUT, validateCheckout } from './checkout-rules';

const VALID: CheckoutValues = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna.kowalska@example.com',
  confirmEmail: 'anna.kowalska@example.com',
  phone: '123456789',
  terms: true,
};

describe('validateCheckout', () => {
  it('accepts a complete form', () => {
    expect(validateCheckout(VALID)).toEqual({});
  });

  it('accepts an empty phone number, the only optional field', () => {
    expect(validateCheckout({ ...VALID, phone: '' })).toEqual({});
  });

  it('requires the required fields and the terms', () => {
    expect(validateCheckout(EMPTY_CHECKOUT)).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name is required',
      email: 'Email is required',
      confirmEmail: 'Confirm email is required',
      terms: 'You must accept the terms and conditions',
    });
  });

  it('requires names of at least 2 characters', () => {
    const errors = validateCheckout({ ...VALID, firstName: 'A', lastName: 'B' });
    expect(errors.firstName).toBe('First name must be at least 2 characters');
    expect(errors.lastName).toBe('Last name must be at least 2 characters');
  });

  it('does not trim names, so a space counts as a character', () => {
    expect(validateCheckout({ ...VALID, firstName: ' A' }).firstName).toBeUndefined();
    expect(validateCheckout({ ...VALID, firstName: ' ' }).firstName).toBe(
      'First name must be at least 2 characters',
    );
  });

  it.each(['not-an-email', 'a@b', 'a@.com', 'a b@example.com', 'a@@example.com'])(
    'rejects the invalid address %s',
    (email) => {
      expect(validateCheckout({ ...VALID, email, confirmEmail: email }).email).toBe(
        'Enter a valid email address',
      );
    },
  );

  it('compares the confirm email with the email as typed', () => {
    expect(validateCheckout({ ...VALID, confirmEmail: 'other@example.com' }).confirmEmail).toBe(
      'Email addresses do not match',
    );
    expect(validateCheckout({ ...VALID, confirmEmail: ' anna.kowalska@example.com' }).confirmEmail).toBe(
      'Email addresses do not match',
    );
  });

  it('requires exactly 9 digits when a phone number is given', () => {
    for (const phone of ['12345678', '1234567890', '12345678a', '123 45678']) {
      expect(validateCheckout({ ...VALID, phone }).phone).toBe(
        'Phone number must be exactly 9 digits',
      );
    }
  });
});

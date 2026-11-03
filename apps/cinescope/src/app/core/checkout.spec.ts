import { EMPTY_CHECKOUT, validateCheckout } from './checkout';

const valid = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna@example.com',
  confirmEmail: 'anna@example.com',
  phone: '',
  terms: true,
};

describe('checkout validation', () => {
  it('accepts a complete form with an empty optional phone', () => {
    expect(validateCheckout(valid)).toEqual({});
  });

  it('requires names of at least two characters', () => {
    expect(validateCheckout({ ...valid, firstName: '' }).firstName).toBe('First name is required');
    expect(validateCheckout({ ...valid, firstName: 'A' }).firstName).toBe(
      'First name must be at least 2 characters',
    );
    expect(validateCheckout({ ...valid, lastName: 'K' }).lastName).toBe('Last name must be at least 2 characters');
  });

  it('accepts only valid email addresses', () => {
    for (const email of ['not-an-email', 'a@b', 'a@.com', 'a b@example.com']) {
      expect(validateCheckout({ ...valid, email, confirmEmail: email }).email).toBe('Enter a valid email address');
    }
    expect(validateCheckout({ ...valid, email: '' }).email).toBe('Email is required');
  });

  it('compares the confirmation with the email as typed', () => {
    expect(validateCheckout({ ...valid, confirmEmail: 'other@example.com' }).confirmEmail).toBe(
      'Email addresses do not match',
    );
    expect(validateCheckout({ ...valid, confirmEmail: '' }).confirmEmail).toBe('Confirm email is required');
  });

  it('requires exactly nine digits for a filled phone', () => {
    expect(validateCheckout({ ...valid, phone: '12345678' }).phone).toBe('Phone number must be exactly 9 digits');
    expect(validateCheckout({ ...valid, phone: '12345678a' }).phone).toBe('Phone number must be exactly 9 digits');
    expect(validateCheckout({ ...valid, phone: '123456789' }).phone).toBeUndefined();
  });

  it('requires the terms', () => {
    expect(validateCheckout({ ...valid, terms: false }).terms).toBe('You must accept the terms and conditions');
  });

  it('reports every field of an empty form', () => {
    expect(Object.keys(validateCheckout(EMPTY_CHECKOUT)).sort()).toEqual(
      ['confirmEmail', 'email', 'firstName', 'lastName', 'terms'].sort(),
    );
  });
});

import { CustomerForm } from '../booking';
import { validate } from './validation';

const valid: CustomerForm = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna@example.com',
  confirmEmail: 'anna@example.com',
  phone: '',
  terms: true,
};

describe('checkout validation', () => {
  it('accepts a complete form with an empty optional phone', () => {
    expect(Object.values(validate(valid)).every((message) => message === null)).toBe(true);
  });

  it('requires names of at least two characters', () => {
    expect(validate({ ...valid, firstName: '' }).firstName).toBe('First name is required');
    expect(validate({ ...valid, firstName: 'A' }).firstName).toBe('First name must be at least 2 characters');
    expect(validate({ ...valid, lastName: 'K' }).lastName).toBe('Last name must be at least 2 characters');
  });

  it('accepts only addresses with a dot in the domain', () => {
    for (const email of ['not-an-email', 'a@b', 'a@.com', 'a b@example.com']) {
      expect(validate({ ...valid, email, confirmEmail: email }).email).toBe('Enter a valid email address');
    }
    expect(validate({ ...valid, email: 'anna@example.com' }).email).toBeNull();
  });

  it('compares confirm email with email as typed', () => {
    expect(validate({ ...valid, confirmEmail: '' }).confirmEmail).toBe('Confirm email is required');
    expect(validate({ ...valid, confirmEmail: 'Anna@example.com' }).confirmEmail).toBe(
      'Email addresses do not match',
    );
  });

  it('accepts an empty phone and exactly nine digits otherwise', () => {
    expect(validate({ ...valid, phone: '' }).phone).toBeNull();
    expect(validate({ ...valid, phone: '123456789' }).phone).toBeNull();
    for (const phone of ['12345678', '1234567890', '12345 6789', '+48123456789']) {
      expect(validate({ ...valid, phone }).phone).toBe('Phone number must be exactly 9 digits');
    }
  });

  it('requires the terms checkbox', () => {
    expect(validate({ ...valid, terms: false }).terms).toBe('You must accept the terms and conditions');
  });
});

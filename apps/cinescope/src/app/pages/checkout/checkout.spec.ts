import { CheckoutValues } from '../../core/models';
import { validate } from './checkout';

const valid: CheckoutValues = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  email: 'anna@example.com',
  confirmEmail: 'anna@example.com',
  phone: '',
  terms: true,
};

describe('checkout validation', () => {
  it('accepts a valid form', () => {
    expect(Object.values(validate(valid)).every((m) => m === null)).toBe(true);
  });

  it('validates emails', () => {
    for (const email of ['not-an-email', 'a@b', 'a@.com', 'a b@c.com', 'a@@c.com']) {
      expect(validate({ ...valid, email, confirmEmail: email }).email).toBe('Enter a valid email address');
    }
    expect(validate({ ...valid, confirmEmail: 'x' }).confirmEmail).toBe('Email addresses do not match');
  });

  it('validates phone and required fields', () => {
    expect(validate({ ...valid, phone: '12345678' }).phone).toBe('Phone number must be exactly 9 digits');
    expect(validate({ ...valid, phone: '123456789' }).phone).toBeNull();
    expect(validate({ ...valid, firstName: '' }).firstName).toBe('First name is required');
    expect(validate({ ...valid, lastName: 'K' }).lastName).toBe('Last name must be at least 2 characters');
    expect(validate({ ...valid, terms: false }).terms).toBe('You must accept the terms and conditions');
  });
});

import { CustomerForm } from '../core/models';

export type FieldName = keyof CustomerForm;
export type FieldErrors = Record<FieldName, string | null>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(v: CustomerForm): FieldErrors {
  return {
    firstName: v.firstName === '' ? 'First name is required' : v.firstName.length < 2 ? 'First name must be at least 2 characters' : null,
    lastName: v.lastName === '' ? 'Last name is required' : v.lastName.length < 2 ? 'Last name must be at least 2 characters' : null,
    email: v.email === '' ? 'Email is required' : !EMAIL.test(v.email) ? 'Enter a valid email address' : null,
    confirmEmail:
      v.confirmEmail === '' ? 'Confirm email is required' : v.confirmEmail !== v.email ? 'Email addresses do not match' : null,
    phone: v.phone !== '' && !/^\d{9}$/.test(v.phone) ? 'Phone number must be exactly 9 digits' : null,
    terms: v.terms ? null : 'You must accept the terms and conditions',
  };
}

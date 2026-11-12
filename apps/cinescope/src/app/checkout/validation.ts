import { FormValues } from '../core/models';

export type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
export type Field = TextField | 'terms';
export type FieldErrors = Record<Field, string | null>;

export const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function name(label: string, value: string): string | null {
  if (value === '') return `${label} is required`;
  return value.length < 2 ? `${label} must be at least 2 characters` : null;
}

export function validate(v: FormValues): FieldErrors {
  return {
    firstName: name('First name', v.firstName),
    lastName: name('Last name', v.lastName),
    email: v.email === '' ? 'Email is required' : EMAIL.test(v.email) ? null : 'Enter a valid email address',
    confirmEmail:
      v.confirmEmail === ''
        ? 'Confirm email is required'
        : v.confirmEmail === v.email
          ? null
          : 'Email addresses do not match',
    phone: v.phone === '' || /^[0-9]{9}$/.test(v.phone) ? null : 'Phone number must be exactly 9 digits',
    terms: v.terms ? null : 'You must accept the terms and conditions',
  };
}

export function isValid(errors: FieldErrors): boolean {
  return FIELDS.every((f) => errors[f] === null);
}

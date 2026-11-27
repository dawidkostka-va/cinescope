import { CheckoutValues } from '../booking';

/** A field of the checkout form. */
export type Field = keyof CheckoutValues;

/** The fields that take text; the terms checkbox is the only other field. */
export type TextField = Exclude<Field, 'terms'>;

export const FIELDS: readonly Field[] = [
  'firstName',
  'lastName',
  'email',
  'confirmEmail',
  'phone',
  'terms',
];

/** The message of each field whose rule fails; a field has at most one. */
export type FieldErrors = Partial<Record<Field, string>>;

/** One or more characters without spaces or `@`, `@`, then a domain with a dot inside. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\d{9}$/;

function nameError(value: string, label: string): string | undefined {
  if (value === '') {
    return `${label} is required`;
  }
  if (value.length < 2) {
    return `${label} must be at least 2 characters`;
  }
  return undefined;
}

/** Validates the checkout form as typed; values are not trimmed. */
export function validateCheckout(values: CheckoutValues): FieldErrors {
  const errors: FieldErrors = {};

  const firstName = nameError(values.firstName, 'First name');
  if (firstName) {
    errors.firstName = firstName;
  }
  const lastName = nameError(values.lastName, 'Last name');
  if (lastName) {
    errors.lastName = lastName;
  }

  if (values.email === '') {
    errors.email = 'Email is required';
  } else if (!EMAIL.test(values.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (values.confirmEmail === '') {
    errors.confirmEmail = 'Confirm email is required';
  } else if (values.confirmEmail !== values.email) {
    errors.confirmEmail = 'Email addresses do not match';
  }

  if (values.phone !== '' && !PHONE.test(values.phone)) {
    errors.phone = 'Phone number must be exactly 9 digits';
  }

  if (!values.terms) {
    errors.terms = 'You must accept the terms and conditions';
  }

  return errors;
}

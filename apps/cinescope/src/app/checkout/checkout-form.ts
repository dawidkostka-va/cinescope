import { CheckoutValues } from '../booking';

/** The fields of the checkout form that can show a message. */
export type CheckoutField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';

/** The message of each field whose rule fails, or null for a valid field. */
export type CheckoutErrors = Record<CheckoutField, string | null>;

export const EMPTY_CHECKOUT: CheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  termsAccepted: false,
};

/** One or more characters without spaces or `@`, `@`, a domain with a dot that has characters on both sides. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\d{9}$/;

function nameError(value: string, label: string): string | null {
  if (value === '') {
    return `${label} is required`;
  }
  return value.length < 2 ? `${label} must be at least 2 characters` : null;
}

/** Checks every field of the checkout form against section 7 and returns the message of each failing one. */
export function checkoutErrors(values: CheckoutValues): CheckoutErrors {
  let email: string | null;
  if (values.email === '') {
    email = 'Email is required';
  } else {
    email = EMAIL.test(values.email) ? null : 'Enter a valid email address';
  }

  let confirmEmail: string | null;
  if (values.confirmEmail === '') {
    confirmEmail = 'Confirm email is required';
  } else {
    confirmEmail = values.confirmEmail === values.email ? null : 'Email addresses do not match';
  }

  return {
    firstName: nameError(values.firstName, 'First name'),
    lastName: nameError(values.lastName, 'Last name'),
    email,
    confirmEmail,
    phone: values.phone === '' || PHONE.test(values.phone) ? null : 'Phone number must be exactly 9 digits',
    terms: values.termsAccepted ? null : 'You must accept the terms and conditions',
  };
}

/** Whether no field fails its rule. */
export function isValidCheckout(errors: CheckoutErrors): boolean {
  return Object.values(errors).every((message) => message === null);
}

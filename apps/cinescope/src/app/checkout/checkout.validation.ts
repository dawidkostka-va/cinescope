import { CheckoutValues } from '../models';

export type CheckoutField = keyof CheckoutValues;
export type CheckoutErrors = Record<CheckoutField, string | null>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\d{9}$/;

export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  return {
    firstName: nameError(values.firstName, 'First name'),
    lastName: nameError(values.lastName, 'Last name'),
    email: emailError(values.email),
    confirmEmail: confirmEmailError(values),
    phone: values.phone === '' || PHONE.test(values.phone) ? null : 'Phone number must be exactly 9 digits',
    terms: values.terms ? null : 'You must accept the terms and conditions',
  };
}

function nameError(value: string, label: string): string | null {
  if (value === '') {
    return `${label} is required`;
  }
  return value.length < 2 ? `${label} must be at least 2 characters` : null;
}

function emailError(value: string): string | null {
  if (value === '') {
    return 'Email is required';
  }
  return EMAIL.test(value) ? null : 'Enter a valid email address';
}

function confirmEmailError(values: CheckoutValues): string | null {
  if (values.confirmEmail === '') {
    return 'Confirm email is required';
  }
  return values.confirmEmail === values.email ? null : 'Email addresses do not match';
}

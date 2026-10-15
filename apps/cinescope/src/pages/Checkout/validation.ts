import type { CheckoutFormValues } from '../../booking/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{9}$/;

export function validateFirstName(value: string): string | undefined {
  if (value === '') return 'First name is required';
  if (value.length < 2) return 'First name must be at least 2 characters';
  return undefined;
}

export function validateLastName(value: string): string | undefined {
  if (value === '') return 'Last name is required';
  if (value.length < 2) return 'Last name must be at least 2 characters';
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  if (value === '') return 'Email is required';
  if (!EMAIL_REGEX.test(value)) return 'Enter a valid email address';
  return undefined;
}

export function validateConfirmEmail(value: string, email: string): string | undefined {
  if (value === '') return 'Confirm email is required';
  if (value !== email) return 'Email addresses do not match';
  return undefined;
}

export function validatePhone(value: string): string | undefined {
  if (value === '') return undefined;
  if (!PHONE_REGEX.test(value)) return 'Phone number must be exactly 9 digits';
  return undefined;
}

export function validateTerms(value: boolean): string | undefined {
  if (!value) return 'You must accept the terms and conditions';
  return undefined;
}

export interface CheckoutErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  confirmEmail?: string;
  phone?: string;
  terms?: string;
}

export function validateForm(values: CheckoutFormValues): CheckoutErrors {
  return {
    firstName: validateFirstName(values.firstName),
    lastName: validateLastName(values.lastName),
    email: validateEmail(values.email),
    confirmEmail: validateConfirmEmail(values.confirmEmail, values.email),
    phone: validatePhone(values.phone),
    terms: validateTerms(values.terms),
  };
}

export function hasErrors(errors: CheckoutErrors): boolean {
  return Object.values(errors).some((message) => message !== undefined);
}

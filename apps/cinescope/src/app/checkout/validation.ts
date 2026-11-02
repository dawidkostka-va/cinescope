import { CustomerForm } from '../booking';

export type Field = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';

export type FieldErrors = Record<Field, string | null>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

function nameError(label: string, value: string): string | null {
  if (value === '') {
    return `${label} is required`;
  }
  return value.length >= 2 ? null : `${label} must be at least 2 characters`;
}

function emailError(value: string): string | null {
  if (value === '') {
    return 'Email is required';
  }
  return EMAIL_PATTERN.test(value) ? null : 'Enter a valid email address';
}

function confirmEmailError(confirmEmail: string, email: string): string | null {
  if (confirmEmail === '') {
    return 'Confirm email is required';
  }
  return confirmEmail === email ? null : 'Email addresses do not match';
}

function phoneError(value: string): string | null {
  if (value === '') {
    return null;
  }
  return PHONE_PATTERN.test(value) ? null : 'Phone number must be exactly 9 digits';
}

export function validate(values: CustomerForm): FieldErrors {
  return {
    firstName: nameError('First name', values.firstName),
    lastName: nameError('Last name', values.lastName),
    email: emailError(values.email),
    confirmEmail: confirmEmailError(values.confirmEmail, values.email),
    phone: phoneError(values.phone),
    terms: values.terms ? null : 'You must accept the terms and conditions',
  };
}

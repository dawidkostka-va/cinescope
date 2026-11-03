import { CustomerForm } from '../core/booking';

export type FieldKey = keyof CustomerForm;

export type FieldErrors = Record<FieldKey, string | null>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

function nameError(value: string, label: string): string | null {
  if (value === '') {
    return `${label} is required`;
  }
  if (value.length < 2) {
    return `${label} must be at least 2 characters`;
  }
  return null;
}

export function validateForm(form: CustomerForm): FieldErrors {
  return {
    firstName: nameError(form.firstName, 'First name'),
    lastName: nameError(form.lastName, 'Last name'),
    email: emailError(form.email),
    confirmEmail: confirmEmailError(form),
    phone: form.phone === '' || PHONE_PATTERN.test(form.phone) ? null : 'Phone number must be exactly 9 digits',
    terms: form.terms ? null : 'You must accept the terms and conditions',
  };
}

function emailError(email: string): string | null {
  if (email === '') {
    return 'Email is required';
  }
  return EMAIL_PATTERN.test(email) ? null : 'Enter a valid email address';
}

function confirmEmailError(form: CustomerForm): string | null {
  if (form.confirmEmail === '') {
    return 'Confirm email is required';
  }
  return form.confirmEmail === form.email ? null : 'Email addresses do not match';
}

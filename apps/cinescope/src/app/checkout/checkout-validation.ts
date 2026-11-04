import type { CheckoutForm } from '../booking.service';

export type CheckoutField = keyof CheckoutForm;
export type CheckoutErrors = Record<CheckoutField, string | undefined>;

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

function emailError(email: string): string | undefined {
  if (email === '') {
    return 'Email is required';
  }
  return EMAIL.test(email) ? undefined : 'Enter a valid email address';
}

function confirmEmailError(email: string, confirmEmail: string): string | undefined {
  if (confirmEmail === '') {
    return 'Confirm email is required';
  }
  return confirmEmail === email ? undefined : 'Email addresses do not match';
}

export function validateCheckout(form: CheckoutForm): CheckoutErrors {
  return {
    firstName: nameError(form.firstName, 'First name'),
    lastName: nameError(form.lastName, 'Last name'),
    email: emailError(form.email),
    confirmEmail: confirmEmailError(form.email, form.confirmEmail),
    phone:
      form.phone === '' || PHONE.test(form.phone)
        ? undefined
        : 'Phone number must be exactly 9 digits',
    terms: form.terms ? undefined : 'You must accept the terms and conditions',
  };
}

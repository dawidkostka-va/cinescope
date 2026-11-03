import { CheckoutForm } from '../core/booking.service';

export type CheckoutField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\d{9}$/;

export function validateCheckout(form: CheckoutForm): CheckoutErrors {
  return {
    firstName: nameError(form.firstName, 'First name'),
    lastName: nameError(form.lastName, 'Last name'),
    email: emailError(form.email),
    confirmEmail: confirmEmailError(form.confirmEmail, form.email),
    phone: form.phone === '' || PHONE.test(form.phone) ? undefined : 'Phone number must be exactly 9 digits',
    terms: form.terms ? undefined : 'You must accept the terms and conditions',
  };
}

export function hasErrors(errors: CheckoutErrors): boolean {
  return Object.values(errors).some((message) => message !== undefined);
}

function nameError(value: string, label: string): string | undefined {
  if (value === '') {
    return `${label} is required`;
  }
  return value.length < 2 ? `${label} must be at least 2 characters` : undefined;
}

function emailError(email: string): string | undefined {
  if (email === '') {
    return 'Email is required';
  }
  return EMAIL.test(email) ? undefined : 'Enter a valid email address';
}

function confirmEmailError(confirmEmail: string, email: string): string | undefined {
  if (confirmEmail === '') {
    return 'Confirm email is required';
  }
  return confirmEmail === email ? undefined : 'Email addresses do not match';
}

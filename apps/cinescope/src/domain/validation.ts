import type { BookingForm } from '../booking/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{9}$/;

export interface CheckoutErrors {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  confirmEmail: string | null;
  phone: string | null;
  terms: string | null;
}

export function validateCheckout(form: BookingForm): CheckoutErrors {
  return {
    firstName:
      form.firstName === ''
        ? 'First name is required'
        : form.firstName.length < 2
          ? 'First name must be at least 2 characters'
          : null,
    lastName:
      form.lastName === ''
        ? 'Last name is required'
        : form.lastName.length < 2
          ? 'Last name must be at least 2 characters'
          : null,
    email: form.email === '' ? 'Email is required' : !EMAIL_RE.test(form.email) ? 'Enter a valid email address' : null,
    confirmEmail:
      form.confirmEmail === ''
        ? 'Confirm email is required'
        : form.confirmEmail !== form.email
          ? 'Email addresses do not match'
          : null,
    phone: form.phone === '' ? null : !PHONE_RE.test(form.phone) ? 'Phone number must be exactly 9 digits' : null,
    terms: form.terms ? null : 'You must accept the terms and conditions',
  };
}

export function hasCheckoutErrors(errors: CheckoutErrors): boolean {
  return Object.values(errors).some((message) => message !== null);
}

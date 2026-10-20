import { CheckoutForm } from '../../booking/types';

export type FieldErrors = Partial<Record<keyof CheckoutForm, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

export function validateCheckoutForm(form: CheckoutForm): FieldErrors {
  const errors: FieldErrors = {};

  if (form.firstName.length === 0) {
    errors.firstName = 'First name is required';
  } else if (form.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (form.lastName.length === 0) {
    errors.lastName = 'Last name is required';
  } else if (form.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  if (form.email.length === 0) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (form.confirmEmail.length === 0) {
    errors.confirmEmail = 'Confirm email is required';
  } else if (form.confirmEmail !== form.email) {
    errors.confirmEmail = 'Email addresses do not match';
  }

  if (form.phone.length > 0 && !PHONE_PATTERN.test(form.phone)) {
    errors.phone = 'Phone number must be exactly 9 digits';
  }

  if (!form.terms) {
    errors.terms = 'You must accept the terms and conditions';
  }

  return errors;
}

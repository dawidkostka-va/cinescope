import { CheckoutValues } from '../booking/booking.store';

export type CheckoutField = keyof CheckoutValues;

export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (values.firstName === '') {
    errors.firstName = 'First name is required';
  } else if (values.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (values.lastName === '') {
    errors.lastName = 'Last name is required';
  } else if (values.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  if (values.email === '') {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (values.confirmEmail === '') {
    errors.confirmEmail = 'Confirm email is required';
  } else if (values.confirmEmail !== values.email) {
    errors.confirmEmail = 'Email addresses do not match';
  }

  if (values.phone !== '' && !PHONE_PATTERN.test(values.phone)) {
    errors.phone = 'Phone number must be exactly 9 digits';
  }

  if (!values.terms) {
    errors.terms = 'You must accept the terms and conditions';
  }

  return errors;
}

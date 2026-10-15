import { CheckoutFormValues } from './booking.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{9}$/;

export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

export function validateCheckoutForm(values: CheckoutFormValues): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};

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
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (values.confirmEmail === '') {
    errors.confirmEmail = 'Confirm email is required';
  } else if (values.confirmEmail !== values.email) {
    errors.confirmEmail = 'Email addresses do not match';
  }

  if (values.phone !== '' && !PHONE_REGEX.test(values.phone)) {
    errors.phone = 'Phone number must be exactly 9 digits';
  }

  if (!values.termsAccepted) {
    errors.termsAccepted = 'You must accept the terms and conditions';
  }

  return errors;
}

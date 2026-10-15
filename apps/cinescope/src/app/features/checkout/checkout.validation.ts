import { CheckoutFormValues } from '../../core/booking.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{9}$/;

export type CheckoutErrors = Partial<Record<keyof CheckoutFormValues, string>>;

export function computeCheckoutErrors(values: CheckoutFormValues): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (values.firstName.length === 0) errors.firstName = 'First name is required';
  else if (values.firstName.length < 2) errors.firstName = 'First name must be at least 2 characters';

  if (values.lastName.length === 0) errors.lastName = 'Last name is required';
  else if (values.lastName.length < 2) errors.lastName = 'Last name must be at least 2 characters';

  if (values.email.length === 0) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(values.email)) errors.email = 'Enter a valid email address';

  if (values.confirmEmail.length === 0) errors.confirmEmail = 'Confirm email is required';
  else if (values.confirmEmail !== values.email) errors.confirmEmail = 'Email addresses do not match';

  if (values.phone.length > 0 && !PHONE_RE.test(values.phone)) {
    errors.phone = 'Phone number must be exactly 9 digits';
  }

  if (!values.termsAccepted) errors.termsAccepted = 'You must accept the terms and conditions';

  return errors;
}

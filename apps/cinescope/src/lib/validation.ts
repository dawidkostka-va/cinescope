import { CheckoutFormValues } from '../booking/types';

export function isValidEmail(value: string): boolean {
  const at = value.indexOf('@');
  if (at <= 0) return false;
  if (value.indexOf('@', at + 1) !== -1) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!local || /[\s@]/.test(local)) return false;
  if (!domain || /[\s@]/.test(domain)) return false;
  for (let i = 0; i < domain.length; i += 1) {
    if (domain[i] === '.' && i > 0 && i < domain.length - 1) return true;
  }
  return false;
}

export interface CheckoutErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  confirmEmail?: string;
  phone?: string;
  terms?: string;
}

export function getCheckoutErrors(form: CheckoutFormValues): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (form.firstName.length === 0) errors.firstName = 'First name is required';
  else if (form.firstName.length < 2) errors.firstName = 'First name must be at least 2 characters';

  if (form.lastName.length === 0) errors.lastName = 'Last name is required';
  else if (form.lastName.length < 2) errors.lastName = 'Last name must be at least 2 characters';

  if (form.email.length === 0) errors.email = 'Email is required';
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address';

  if (form.confirmEmail.length === 0) errors.confirmEmail = 'Confirm email is required';
  else if (form.confirmEmail !== form.email) errors.confirmEmail = 'Email addresses do not match';

  if (form.phone.length > 0 && !/^\d{9}$/.test(form.phone)) {
    errors.phone = 'Phone number must be exactly 9 digits';
  }

  if (!form.acceptedTerms) errors.terms = 'You must accept the terms and conditions';

  return errors;
}

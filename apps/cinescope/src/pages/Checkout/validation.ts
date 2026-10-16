import type { BookingForm } from '../../booking/bookingStore';

export interface BookingFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  confirmEmail?: string;
  phone?: string;
  terms?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateForm(form: BookingForm): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (form.firstName === '') errors.firstName = 'First name is required';
  else if (form.firstName.length < 2) errors.firstName = 'First name must be at least 2 characters';

  if (form.lastName === '') errors.lastName = 'Last name is required';
  else if (form.lastName.length < 2) errors.lastName = 'Last name must be at least 2 characters';

  if (form.email === '') errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(form.email)) errors.email = 'Enter a valid email address';

  if (form.confirmEmail === '') errors.confirmEmail = 'Confirm email is required';
  else if (form.confirmEmail !== form.email) errors.confirmEmail = 'Email addresses do not match';

  if (form.phone !== '' && !/^\d{9}$/.test(form.phone)) {
    errors.phone = 'Phone number must be exactly 9 digits';
  }

  if (!form.terms) errors.terms = 'You must accept the terms and conditions';

  return errors;
}

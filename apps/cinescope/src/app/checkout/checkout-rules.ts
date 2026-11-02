import { CheckoutValues } from '../booking';

export type CheckoutField = keyof CheckoutValues;
export type CheckoutErrors = Partial<Record<CheckoutField, string | undefined>>;

export const CHECKOUT_FIELDS: CheckoutField[] = [
  'firstName',
  'lastName',
  'email',
  'confirmEmail',
  'phone',
  'terms',
];

export const EMPTY_CHECKOUT: CheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  return {
    firstName: nameError(values.firstName, 'First name'),
    lastName: nameError(values.lastName, 'Last name'),
    email: emailError(values.email),
    confirmEmail: confirmEmailError(values.confirmEmail, values.email),
    phone:
      values.phone !== '' && !PHONE_PATTERN.test(values.phone)
        ? 'Phone number must be exactly 9 digits'
        : undefined,
    terms: values.terms ? undefined : 'You must accept the terms and conditions',
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
  return EMAIL_PATTERN.test(email) ? undefined : 'Enter a valid email address';
}

function confirmEmailError(confirmEmail: string, email: string): string | undefined {
  if (confirmEmail === '') {
    return 'Confirm email is required';
  }
  return confirmEmail === email ? undefined : 'Email addresses do not match';
}

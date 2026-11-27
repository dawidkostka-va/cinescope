/** The values of the checkout form, kept in the booking as they are typed (section 7.1). */
export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export type CheckoutField = keyof CheckoutValues;

export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export const CHECKOUT_FIELDS: readonly CheckoutField[] = [
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

/** A valid address: characters without spaces or `@`, `@`, then a domain with a dot inside. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

/** Returns the message of every failing field (section 7). Values are not trimmed. */
export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};

  const firstNameError = nameError('First name', values.firstName);
  if (firstNameError) {
    errors.firstName = firstNameError;
  }
  const lastNameError = nameError('Last name', values.lastName);
  if (lastNameError) {
    errors.lastName = lastNameError;
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

function nameError(label: string, value: string): string | null {
  if (value === '') {
    return `${label} is required`;
  }
  if (value.length < 2) {
    return `${label} must be at least 2 characters`;
  }
  return null;
}

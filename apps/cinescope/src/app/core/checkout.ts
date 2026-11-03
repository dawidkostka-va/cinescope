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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\d{9}$/;

function nameError(label: string, value: string): string | undefined {
  if (!value) {
    return `${label} is required`;
  }
  return value.length < 2 ? `${label} must be at least 2 characters` : undefined;
}

export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const set = (field: CheckoutField, message: string | undefined) => {
    if (message) {
      errors[field] = message;
    }
  };
  set('firstName', nameError('First name', values.firstName));
  set('lastName', nameError('Last name', values.lastName));
  if (!values.email) {
    set('email', 'Email is required');
  } else if (!EMAIL.test(values.email)) {
    set('email', 'Enter a valid email address');
  }
  if (!values.confirmEmail) {
    set('confirmEmail', 'Confirm email is required');
  } else if (values.confirmEmail !== values.email) {
    set('confirmEmail', 'Email addresses do not match');
  }
  if (values.phone && !PHONE.test(values.phone)) {
    set('phone', 'Phone number must be exactly 9 digits');
  }
  if (!values.terms) {
    set('terms', 'You must accept the terms and conditions');
  }
  return errors;
}

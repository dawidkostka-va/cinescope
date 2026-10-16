const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{9}$/;

function validateRequiredText(
  value: string,
  label: string,
  minLength: number,
  tooShortMessage: string,
): string | null {
  if (value.length === 0) return `${label} is required`;
  if (value.length < minLength) return tooShortMessage;
  return null;
}

export function validateFirstName(value: string): string | null {
  return validateRequiredText(
    value,
    'First name',
    2,
    'First name must be at least 2 characters',
  );
}

export function validateLastName(value: string): string | null {
  return validateRequiredText(
    value,
    'Last name',
    2,
    'Last name must be at least 2 characters',
  );
}

export function validateEmail(value: string): string | null {
  if (value.length === 0) return 'Email is required';
  return EMAIL_REGEX.test(value) ? null : 'Enter a valid email address';
}

export function validateConfirmEmail(email: string, confirmEmail: string): string | null {
  if (confirmEmail.length === 0) return 'Confirm email is required';
  return confirmEmail === email ? null : 'Email addresses do not match';
}

export function validatePhone(value: string): string | null {
  if (value.length === 0) return null;
  return PHONE_REGEX.test(value) ? null : 'Phone number must be exactly 9 digits';
}

export function validateTerms(checked: boolean): string | null {
  return checked ? null : 'You must accept the terms and conditions';
}

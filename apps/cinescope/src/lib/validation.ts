const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

export function validateFirstName(value: string): string | null {
  if (value.length === 0) return 'First name is required';
  if (value.length < 2) return 'First name must be at least 2 characters';
  return null;
}

export function validateLastName(value: string): string | null {
  if (value.length === 0) return 'Last name is required';
  if (value.length < 2) return 'Last name must be at least 2 characters';
  return null;
}

export function validateEmail(value: string): string | null {
  if (value.length === 0) return 'Email is required';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address';
  return null;
}

export function validateConfirmEmail(email: string, confirmEmail: string): string | null {
  if (confirmEmail.length === 0) return 'Confirm email is required';
  if (confirmEmail !== email) return 'Email addresses do not match';
  return null;
}

export function validatePhone(value: string): string | null {
  if (value.length === 0) return null;
  if (!PHONE_PATTERN.test(value)) return 'Phone number must be exactly 9 digits';
  return null;
}

export function validateTerms(checked: boolean): string | null {
  return checked ? null : 'You must accept the terms and conditions';
}

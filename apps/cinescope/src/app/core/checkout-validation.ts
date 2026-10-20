const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{9}$/;

export function firstNameError(value: string): string | null {
  if (value.length === 0) return 'First name is required';
  if (value.length < 2) return 'First name must be at least 2 characters';
  return null;
}

export function lastNameError(value: string): string | null {
  if (value.length === 0) return 'Last name is required';
  if (value.length < 2) return 'Last name must be at least 2 characters';
  return null;
}

export function emailError(value: string): string | null {
  if (value.length === 0) return 'Email is required';
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address';
  return null;
}

export function confirmEmailError(value: string, email: string): string | null {
  if (value.length === 0) return 'Confirm email is required';
  if (value !== email) return 'Email addresses do not match';
  return null;
}

export function phoneError(value: string): string | null {
  if (value.length === 0) return null;
  if (!PHONE_RE.test(value)) return 'Phone number must be exactly 9 digits';
  return null;
}

export function termsError(checked: boolean): string | null {
  return checked ? null : 'You must accept the terms and conditions';
}

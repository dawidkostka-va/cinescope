const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

export function validateRequiredName(value: string, label: string): string | null {
  if (value === '') return `${label} is required`;
  if (value.length < 2) return `${label} must be at least 2 characters`;
  return null;
}

export function validateEmail(value: string): string | null {
  if (value === '') return 'Email is required';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address';
  return null;
}

export function validateConfirmEmail(email: string, confirmEmail: string): string | null {
  if (confirmEmail === '') return 'Confirm email is required';
  if (confirmEmail !== email) return 'Email addresses do not match';
  return null;
}

export function validatePhone(value: string): string | null {
  if (value === '') return null;
  if (!PHONE_PATTERN.test(value)) return 'Phone number must be exactly 9 digits';
  return null;
}

export function validateTerms(accepted: boolean): string | null {
  if (!accepted) return 'You must accept the terms and conditions';
  return null;
}

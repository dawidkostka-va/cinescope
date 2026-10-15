const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFirstName(value: string): string | null {
  if (value === '') return 'First name is required';
  if (value.length < 2) return 'First name must be at least 2 characters';
  return null;
}

export function validateLastName(value: string): string | null {
  if (value === '') return 'Last name is required';
  if (value.length < 2) return 'Last name must be at least 2 characters';
  return null;
}

export function validateEmail(value: string): string | null {
  if (value === '') return 'Email is required';
  if (!EMAIL_REGEX.test(value)) return 'Enter a valid email address';
  return null;
}

export function validateConfirmEmail(value: string, email: string): string | null {
  if (value === '') return 'Confirm email is required';
  if (value !== email) return 'Email addresses do not match';
  return null;
}

export function validatePhone(value: string): string | null {
  if (value === '') return null;
  if (!/^\d{9}$/.test(value)) return 'Phone number must be exactly 9 digits';
  return null;
}

export function validateTerms(value: boolean): string | null {
  return value ? null : 'You must accept the terms and conditions';
}

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

function fail(message: string): ValidationErrors {
  return { message };
}

export function minLengthField(label: string): ValidatorFn {
  return (control) => {
    const value: string = control.value ?? '';
    if (value.length === 0) return fail(`${label} is required`);
    if (value.length < 2) return fail(`${label} must be at least 2 characters`);
    return null;
  };
}

export const emailValidator: ValidatorFn = (control) => {
  const value: string = control.value ?? '';
  if (value.length === 0) return fail('Email is required');
  return EMAIL_PATTERN.test(value) ? null : fail('Enter a valid email address');
};

export const confirmEmailValidator: ValidatorFn = (control: AbstractControl) => {
  const value: string = control.value ?? '';
  if (value.length === 0) return fail('Confirm email is required');
  return value === control.parent?.get('email')?.value
    ? null
    : fail('Email addresses do not match');
};

export const phoneValidator: ValidatorFn = (control) => {
  const value: string = control.value ?? '';
  if (value.length === 0) return null;
  return PHONE_PATTERN.test(value) ? null : fail('Phone number must be exactly 9 digits');
};

export const termsValidator: ValidatorFn = (control) =>
  control.value === true ? null : fail('You must accept the terms and conditions');

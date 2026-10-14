import { AbstractControl, ValidationErrors } from '@angular/forms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

export function emailFormatValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value === '') return null;
  return EMAIL_PATTERN.test(control.value) ? null : { emailFormat: true };
}

export function confirmEmailValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value === '') return null;
  const email = control.parent?.get('email')?.value;
  return control.value === email ? null : { mismatch: true };
}

export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value === '') return null;
  return PHONE_PATTERN.test(control.value) ? null : { invalidPhone: true };
}

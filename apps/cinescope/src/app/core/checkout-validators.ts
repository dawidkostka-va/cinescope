import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

export function emailFormatValidator(control: AbstractControl<string>): ValidationErrors | null {
  if (control.value === '') {
    return null;
  }
  return EMAIL_PATTERN.test(control.value) ? null : { emailFormat: true };
}

export function phoneFormatValidator(control: AbstractControl<string>): ValidationErrors | null {
  if (control.value === '') {
    return null;
  }
  return PHONE_PATTERN.test(control.value) ? null : { phoneFormat: true };
}

export function matchesControl(other: AbstractControl<string>): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    return control.value === other.value ? null : { mismatch: true };
  };
}

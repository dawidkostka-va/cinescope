import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

function isEmpty(value: unknown): boolean {
  return value === '' || value === null || value === undefined;
}

export function emailFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) return null;
    return EMAIL_PATTERN.test(control.value) ? null : { emailFormat: true };
  };
}

export function phoneFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (isEmpty(control.value)) return null;
    return PHONE_PATTERN.test(control.value) ? null : { phoneFormat: true };
  };
}

export function matchesControlValidator(otherControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(otherControlName);
    if (!other) return null;
    return control.value === other.value ? null : { mismatch: true };
  };
}

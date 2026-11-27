import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { CheckoutValues } from '../booking';

export type CheckoutField = keyof CheckoutValues;

export type CheckoutForm = FormGroup<{ [K in CheckoutField]: FormControl<CheckoutValues[K]> }>;

/** One or more characters without spaces or `@`, then `@`, then a domain with a dot that has characters on each side. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

/** Messages by validation error key; the first key of a field that has a message is shown. */
const MESSAGES: Record<CheckoutField, Partial<Record<string, string>>> = {
  firstName: {
    required: 'First name is required',
    minlength: 'First name must be at least 2 characters',
  },
  lastName: {
    required: 'Last name is required',
    minlength: 'Last name must be at least 2 characters',
  },
  email: {
    required: 'Email is required',
    pattern: 'Enter a valid email address',
  },
  confirmEmail: {
    required: 'Confirm email is required',
    mismatch: 'Email addresses do not match',
  },
  phone: {
    pattern: 'Phone number must be exactly 9 digits',
  },
  terms: {
    required: 'You must accept the terms and conditions',
  },
};

const EMPTY_VALUES: CheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

/** Confirm email must equal Email as typed; an empty confirmation is reported by `required` instead. */
const matchesEmail: ValidatorFn = (control) => {
  const email = control.parent?.get('email')?.value;
  return control.value === '' || control.value === email ? null : { mismatch: true };
};

/** Builds the checkout form with the given values; without values the form is empty. */
export function createCheckoutForm(values: CheckoutValues | undefined): CheckoutForm {
  const initial = values ?? EMPTY_VALUES;
  const form: CheckoutForm = new FormGroup({
    firstName: new FormControl(initial.firstName, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl(initial.lastName, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl(initial.email, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    confirmEmail: new FormControl(initial.confirmEmail, {
      nonNullable: true,
      validators: [Validators.required, matchesEmail],
    }),
    phone: new FormControl(initial.phone, {
      nonNullable: true,
      validators: [Validators.pattern(PHONE_PATTERN)],
    }),
    terms: new FormControl(initial.terms, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  // The confirmation is compared with Email, so it is checked again whenever Email changes. The
  // initial check runs now because the control had no parent when it was created.
  form.controls.email.valueChanges.subscribe(() =>
    form.controls.confirmEmail.updateValueAndValidity(),
  );
  form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });
  return form;
}

/**
 * The message shown for a field: only once the field has been left, and at most one. Null when
 * the field is valid or has not been left yet.
 */
export function checkoutErrorMessage(form: CheckoutForm, field: CheckoutField): string | null {
  const control = form.controls[field];
  if (!control.touched || !control.errors) {
    return null;
  }
  for (const key of Object.keys(control.errors)) {
    const message = MESSAGES[field][key];
    if (message) {
      return message;
    }
  }
  return null;
}

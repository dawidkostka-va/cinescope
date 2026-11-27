import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService, CheckoutValues, formatPrice, ticketsFor } from '../booking';
import { ToastService } from '../toast/toast';

type FieldName = keyof CheckoutValues;

/** An email address: no spaces or `@` around one `@`, and a dot with characters on both sides in the domain. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Exactly nine digits (section 7). */
const PHONE_PATTERN = /^\d{9}$/;

const EMPTY_VALUES: CheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

/** The message of each validation error of each field (section 7). */
const MESSAGES: Record<FieldName, Record<string, string>> = {
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

/** Confirm email must equal Email as typed. An empty value is left to the required check. */
function matchesEmail(control: AbstractControl): ValidationErrors | null {
  const email: unknown = control.parent?.get('email')?.value;
  return control.value === '' || control.value === email ? null : { mismatch: true };
}

/** The checkout: customer details and payment (section 7). */
@Component({
  selector: 'app-checkout',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  /** The booking in progress; the route guard makes sure it exists. */
  private readonly booking = this.bookings.load();

  readonly tickets = ticketsFor(this.booking?.seats ?? []);
  readonly total = this.tickets.reduce((sum, ticket) => sum + ticket.price, 0);
  readonly totalLabel = formatPrice(this.total);

  /** True while the payment request is in flight. */
  readonly submitting = signal(false);

  /** The values typed before are restored, so the form survives going back and reloads (section 7.1). */
  readonly form = new FormGroup({
    firstName: new FormControl(this.booking?.checkout?.firstName ?? EMPTY_VALUES.firstName, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl(this.booking?.checkout?.lastName ?? EMPTY_VALUES.lastName, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl(this.booking?.checkout?.email ?? EMPTY_VALUES.email, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    confirmEmail: new FormControl(
      this.booking?.checkout?.confirmEmail ?? EMPTY_VALUES.confirmEmail,
      { nonNullable: true, validators: [Validators.required, matchesEmail] },
    ),
    phone: new FormControl(this.booking?.checkout?.phone ?? EMPTY_VALUES.phone, {
      nonNullable: true,
      validators: [Validators.pattern(PHONE_PATTERN)],
    }),
    terms: new FormControl(this.booking?.checkout?.terms ?? EMPTY_VALUES.terms, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  constructor() {
    // The confirm-email check was made before the form existed, so it is run again now.
    this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });

    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmEmail.updateValueAndValidity());

    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.bookings.update({ checkout: this.form.getRawValue() }));
  }

  /** The message to show under a field: only once it has been left, and only one. */
  errorOf(field: FieldName): string | null {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) {
      return null;
    }
    const messages = MESSAGES[field];
    const key = Object.keys(control.errors).find((name) => name in messages);
    return key === undefined ? null : messages[key];
  }

  /** Pays: sends the reservation if the form is valid, otherwise marks every field and stays. */
  async pay(): Promise<void> {
    if (this.submitting()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toasts.show('The form contains errors');
      return;
    }
    if (this.booking === null) {
      return;
    }

    const values = this.form.getRawValue();
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.api.createReservation({
          screeningId: this.booking.screeningId,
          seats: this.tickets.flatMap((ticket) => ticket.ids),
          customer: {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
          },
          totalPrice: this.total,
        }),
      );
    } catch {
      this.submitting.set(false);
      this.toasts.show('Payment failed. Please try again.');
      return;
    }

    this.bookings.update({ paid: { email: values.email } });
    await this.router.navigate(['/confirmation']);
  }

  back(): void {
    if (this.booking !== null) {
      void this.router.navigate(['/screenings', this.booking.screeningId, 'summary']);
    }
  }
}

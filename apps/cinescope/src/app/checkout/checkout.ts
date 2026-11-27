import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { BookingStore, CheckoutValues, seatIdentifiers, sortUnits } from '../booking';
import { API_BASE_URL, NewReservation, Reservation } from '../models';
import { formatPrice, priceOf } from '../pricing';
import { Toast } from '../toast';

type Field = keyof CheckoutValues;

type CheckoutForm = { [K in Field]: FormControl<CheckoutValues[K]> };

/** Section 7: a valid email address, e.g. `anna@example.com`. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Section 7: an empty phone number is valid; a filled one is exactly 9 digits. */
const PHONE_PATTERN = /^\d{9}$/;

const INVALID_FORM_MESSAGE = 'The form contains errors';
const PAYMENT_FAILED_MESSAGE = 'Payment failed. Please try again.';

/** Messages of section 7. `required` is shown for an empty field; `rule` when a non-empty value fails. */
const MESSAGES: Record<Field, { required?: string; rule: string }> = {
  firstName: { required: 'First name is required', rule: 'First name must be at least 2 characters' },
  lastName: { required: 'Last name is required', rule: 'Last name must be at least 2 characters' },
  email: { required: 'Email is required', rule: 'Enter a valid email address' },
  confirmEmail: { required: 'Confirm email is required', rule: 'Email addresses do not match' },
  phone: { rule: 'Phone number must be exactly 9 digits' },
  terms: { rule: 'You must accept the terms and conditions' },
};

/** Builds the checkout form with its validators, restoring the values saved in the booking. */
function createForm(saved: CheckoutValues | undefined): FormGroup<CheckoutForm> {
  const email = new FormControl(saved?.email ?? '', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
  });
  // Compared with Email as typed, whatever Email holds (section 7).
  const confirmEmail = new FormControl(saved?.confirmEmail ?? '', {
    nonNullable: true,
    validators: [
      Validators.required,
      (control) => (control.value === email.value ? null : { mismatch: true }),
    ],
  });
  email.valueChanges.subscribe(() => confirmEmail.updateValueAndValidity());

  return new FormGroup<CheckoutForm>({
    firstName: new FormControl(saved?.firstName ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl(saved?.lastName ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email,
    confirmEmail,
    phone: new FormControl(saved?.phone ?? '', {
      nonNullable: true,
      validators: [Validators.pattern(PHONE_PATTERN)],
    }),
    terms: new FormControl(saved?.terms ?? false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });
}

/** `Your details` (section 7): the customer's details, the payment and the way back. */
@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(Toast);
  private readonly booking = inject(BookingStore);

  /** The booking as it was when the page opened; the guard guarantees it exists. */
  private readonly snapshot = this.booking.read();

  /** Total of the booking in PLN, shown on the pay button. */
  private readonly total = (this.snapshot?.units ?? []).reduce((sum, unit) => sum + priceOf(unit), 0);

  protected readonly totalLabel = formatPrice(this.total);

  protected readonly form = createForm(this.snapshot?.checkout);

  /** True while `POST /reservations` is in flight. */
  protected readonly submitting = signal(false);

  constructor() {
    // Every change is saved in the booking as it is typed (section 7.1).
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.booking.update({ checkout: this.form.getRawValue() }));
  }

  /** Whether the message of a field is shown: the field has been left and its value is invalid. */
  protected showsError(field: Field): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  /** The single message of a field (section 7). */
  protected errorText(field: Field): string {
    const errors: ValidationErrors = this.form.controls[field].errors ?? {};
    const messages = MESSAGES[field];
    return errors['required'] && messages.required ? messages.required : messages.rule;
  }

  /** Returns to the summary with the booking intact. */
  protected back(): void {
    const booking = this.booking.read();
    if (booking) {
      this.router.navigate(['/screenings', booking.screeningId, 'summary']);
    }
  }

  /** Validates the form and pays: sends the reservation and opens the confirmation on success. */
  protected pay(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.show(INVALID_FORM_MESSAGE);
      return;
    }
    const booking = this.booking.read();
    if (!booking) {
      return;
    }
    const values = this.form.getRawValue();
    const body: NewReservation = {
      screeningId: booking.screeningId,
      seats: sortUnits(booking.units).flatMap(seatIdentifiers),
      customer: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      },
      totalPrice: this.total,
    };

    this.submitting.set(true);
    this.http.post<Reservation>(`${API_BASE_URL}/reservations`, body).subscribe({
      next: () => {
        this.booking.update({ paidEmail: values.email });
        this.router.navigate(['/confirmation']);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.show(PAYMENT_FAILED_MESSAGE);
      },
    });
  }
}

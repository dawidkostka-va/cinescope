import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingStore, EMPTY_CHECKOUT } from '../booking/booking';
import { formatPrice, identifiersOfTicket, ticketsFor, totalOf } from '../booking/tickets';
import { CinemaApi } from '../cinema-api';
import { Toaster } from '../toast/toast';

type CheckoutField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';

/** A valid address: no spaces or `@`, then `@`, then a domain with a dot that has a character on each side. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

/** Message for each failing rule, by the error key the rule reports. */
const MESSAGES: Record<CheckoutField, Record<string, string>> = {
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

/** An empty confirmation matches nothing and is reported as required instead. */
function confirmEmailMatches(control: AbstractControl): ValidationErrors | null {
  const email: unknown = control.parent?.get('email')?.value;
  return control.value === '' || control.value === email ? null : { mismatch: true };
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButton, MatCheckbox, MatFormFieldModule, MatInput],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toaster = inject(Toaster);
  private readonly bookings = inject(BookingStore);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly screeningId = computed(() => Number(this.params().get('id')));

  /** The total of the booking, e.g. `121.00 PLN`. */
  protected readonly totalText = computed(() => formatPrice(totalOf(this.bookings.booking()?.seats ?? [])));

  /** A payment request is in flight. */
  protected readonly submitting = signal(false);

  private readonly saved = this.bookings.booking()?.checkout ?? EMPTY_CHECKOUT;

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    firstName: [this.saved.firstName, [Validators.required, Validators.minLength(2)]],
    lastName: [this.saved.lastName, [Validators.required, Validators.minLength(2)]],
    email: [this.saved.email, [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    confirmEmail: [this.saved.confirmEmail, [Validators.required, confirmEmailMatches]],
    phone: [this.saved.phone, [Validators.pattern(PHONE_PATTERN)]],
    terms: [this.saved.terms, [Validators.requiredTrue]],
  });

  constructor() {
    // Every change of the form is kept in the booking, so it survives going back and reloading.
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.bookings.setCheckout(this.form.getRawValue()));

    // The confirmation is compared with the email as typed, so it is re-checked whenever the email changes.
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmEmail.updateValueAndValidity());
  }

  /** The message of a field's failing rule, or an empty string when the field is valid. */
  protected messageOf(field: CheckoutField): string {
    const errors = this.form.controls[field].errors ?? {};
    const key = Object.keys(MESSAGES[field]).find((rule) => rule in errors);
    return key === undefined ? '' : MESSAGES[field][key];
  }

  protected onTermsToggled(): void {
    this.form.controls.terms.markAsTouched();
  }

  protected onBack(): void {
    void this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  protected pay(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toaster.show('The form contains errors');
      return;
    }

    const booking = this.bookings.booking();
    if (booking === null) {
      void this.router.navigate(['/']);
      return;
    }

    const values = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats: ticketsFor(booking.seats).flatMap(identifiersOfTicket),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: totalOf(booking.seats),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.bookings.markPaid(values.email);
          void this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toaster.show('Payment failed. Please try again.');
        },
      });
  }
}

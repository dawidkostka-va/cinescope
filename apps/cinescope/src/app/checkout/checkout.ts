import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { BookingService, CheckoutValues } from '../core/booking';
import { CinemaApi } from '../core/cinema-api';
import { Toast } from '../core/toast';
import { compareSeatIds, formatPln, totalOf } from '../core/seats';

type Field = keyof CheckoutValues;
type Errors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

function validate(values: CheckoutValues): Errors {
  const errors: Errors = {};
  if (values.firstName === '') {
    errors.firstName = 'First name is required';
  } else if (values.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }
  if (values.lastName === '') {
    errors.lastName = 'Last name is required';
  } else if (values.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }
  if (values.email === '') {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (values.confirmEmail === '') {
    errors.confirmEmail = 'Confirm email is required';
  } else if (values.confirmEmail !== values.email) {
    errors.confirmEmail = 'Email addresses do not match';
  }
  if (values.phone !== '' && !PHONE_PATTERN.test(values.phone)) {
    errors.phone = 'Phone number must be exactly 9 digits';
  }
  if (!values.terms) {
    errors.terms = 'You must accept the terms and conditions';
  }
  return errors;
}

@Component({
  selector: 'app-checkout',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(Toast);

  readonly id = input.required<string>();

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    confirmEmail: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    terms: new FormControl(false, { nonNullable: true }),
  });

  readonly values = signal<CheckoutValues>(this.form.getRawValue());
  readonly errors = computed(() => validate(this.values()));
  readonly touched = signal<ReadonlySet<Field>>(new Set());
  readonly submitting = signal(false);

  readonly total = computed(() => totalOf(this.booking.booking()?.seats ?? []));
  readonly payLabel = computed(() =>
    this.submitting() ? 'Processing…' : `Pay ${formatPln(this.total())}`,
  );

  constructor() {
    const saved = this.booking.booking()?.form;
    if (saved) {
      this.form.setValue(saved);
    }
    this.values.set(this.form.getRawValue());
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const values = this.form.getRawValue();
      this.values.set(values);
      this.booking.setForm(values);
    });
  }

  touch(field: Field): void {
    this.touched.update((fields) => new Set([...fields, field]));
  }

  shown(field: Field): string | null {
    return this.touched().has(field) ? (this.errors()[field] ?? null) : null;
  }

  back(): void {
    this.router.navigate(['/screenings', this.id(), 'summary']);
  }

  pay(): void {
    this.touched.set(new Set(FIELDS));
    const values = this.values();
    const seats = this.booking.booking()?.seats ?? [];
    const screeningId = this.booking.booking()?.screeningId;
    if (Object.keys(this.errors()).length > 0) {
      this.toast.show('The form contains errors');
      return;
    }
    if (screeningId === undefined) {
      return;
    }
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId,
        seats: [...seats].sort(compareSeatIds),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: totalOf(seats),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(values.email);
          this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { API_URL } from '../api';
import { BookingService } from '../booking.service';
import { CheckoutValues, Reservation } from '../models';
import { ToastService } from '../toast.service';
import { bookedItems, formatPrice } from '../seats';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

type FieldName = keyof CheckoutValues;

const LABELS: Record<Exclude<FieldName, 'phone' | 'terms'>, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  confirmEmail: 'Confirm email',
};

function createCheckoutForm(values: CheckoutValues) {
  const email = new FormControl(values.email, {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
  });
  const confirmEmail = new FormControl(values.confirmEmail, {
    nonNullable: true,
    validators: [
      Validators.required,
      (control): ValidationErrors | null => (control.value === email.value ? null : { mismatch: true }),
    ],
  });
  email.valueChanges.subscribe(() => confirmEmail.updateValueAndValidity());

  return new FormGroup({
    firstName: new FormControl(values.firstName, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl(values.lastName, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email,
    confirmEmail,
    phone: new FormControl(values.phone, {
      nonNullable: true,
      validators: [Validators.pattern(PHONE_PATTERN)],
    }),
    terms: new FormControl(values.terms, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly formatPrice = formatPrice;
  readonly submitting = signal(false);

  readonly items = computed(() => bookedItems(this.booking.booking()?.seats ?? []));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  readonly form = createCheckoutForm(
    this.booking.booking()?.checkout ?? {
      firstName: '',
      lastName: '',
      email: '',
      confirmEmail: '',
      phone: '',
      terms: false,
    },
  );

  constructor() {
    this.form.valueChanges.subscribe(() => this.booking.update({ checkout: this.form.getRawValue() }));
  }

  messageFor(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.touched || control.valid || !control.errors) {
      return null;
    }
    const errors = control.errors;
    if (name === 'terms') {
      return 'You must accept the terms and conditions';
    }
    if (name === 'phone') {
      return 'Phone number must be exactly 9 digits';
    }
    if (errors['required']) {
      return `${LABELS[name]} is required`;
    }
    if (name === 'firstName' || name === 'lastName') {
      return `${LABELS[name]} must be at least 2 characters`;
    }
    if (name === 'email') {
      return 'Enter a valid email address';
    }
    return 'Email addresses do not match';
  }

  back(): void {
    this.router.navigate(['/screenings', this.booking.booking()?.screeningId, 'summary']);
  }

  pay(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const booking = this.booking.booking();
    if (!booking || this.submitting()) {
      return;
    }
    const values = this.form.getRawValue();
    const body: Omit<Reservation, 'id'> = {
      screeningId: booking.screeningId,
      seats: this.items().flatMap((item) => item.ids),
      customer: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      },
      totalPrice: this.total(),
    };
    this.submitting.set(true);
    this.http.post<Reservation>(`${API_URL}/reservations`, body).subscribe({
      next: () => {
        this.booking.update({ paidEmail: values.email });
        this.router.navigate(['/confirmation']);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.show('Payment failed. Please try again.');
      },
    });
  }
}

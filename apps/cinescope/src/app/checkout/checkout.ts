import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CinemaApi } from '../api';
import { BookingService, CheckoutForm } from '../booking/booking';
import { formatPrice, totalPriceOf } from '../booking/pricing';
import { bookedCells } from '../seat-selection/auditorium';
import { Toaster } from '../toast/toast';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type Field = TextField | 'terms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

const NOT_TOUCHED: Record<Field, boolean> = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  terms: false,
};

const ALL_TOUCHED: Record<Field, boolean> = {
  firstName: true,
  lastName: true,
  email: true,
  confirmEmail: true,
  phone: true,
  terms: true,
};

const EMPTY_FORM: CheckoutForm = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function nameError(value: string, label: string): string | null {
  if (!value) {
    return `${label} is required`;
  }
  return value.length < 2 ? `${label} must be at least 2 characters` : null;
}

function emailError(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }
  return EMAIL_PATTERN.test(email) ? null : 'Enter a valid email address';
}

function confirmEmailError(confirmEmail: string, email: string): string | null {
  if (!confirmEmail) {
    return 'Confirm email is required';
  }
  return confirmEmail === email ? null : 'Email addresses do not match';
}

function phoneError(phone: string): string | null {
  if (!phone) {
    return null;
  }
  return PHONE_PATTERN.test(phone) ? null : 'Phone number must be exactly 9 digits';
}

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  readonly id = input.required<string>();

  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly bookings = inject(BookingService);
  private readonly toaster = inject(Toaster);

  readonly seats = signal(this.bookings.current()?.seats ?? []);
  readonly form = signal<CheckoutForm>(this.bookings.current()?.checkout ?? EMPTY_FORM);
  readonly touched = signal<Record<Field, boolean>>(NOT_TOUCHED);
  readonly submitting = signal(false);

  readonly total = computed(() => totalPriceOf(this.seats()));
  readonly payLabel = computed(() => `Pay ${formatPrice(this.total())}`);

  private readonly errors = computed<Record<Field, string | null>>(() => {
    const form = this.form();
    return {
      firstName: nameError(form.firstName, 'First name'),
      lastName: nameError(form.lastName, 'Last name'),
      email: emailError(form.email),
      confirmEmail: confirmEmailError(form.confirmEmail, form.email),
      phone: phoneError(form.phone),
      terms: form.terms ? null : 'You must accept the terms and conditions',
    };
  });

  private readonly hasErrors = computed(() => Object.values(this.errors()).some((error) => error !== null));

  fieldError(field: Field): string | null {
    return this.touched()[field] ? this.errors()[field] : null;
  }

  touch(field: Field): void {
    this.touched.update((touched) => ({ ...touched, [field]: true }));
  }

  setText(field: TextField, event: Event): void {
    this.edit({ [field]: (event.target as HTMLInputElement).value });
  }

  setTerms(event: Event): void {
    this.edit({ terms: (event.target as HTMLInputElement).checked });
    this.touch('terms');
  }

  pay(): void {
    this.touched.set(ALL_TOUCHED);
    if (this.hasErrors()) {
      this.toaster.show('The form contains errors');
      return;
    }
    const booking = this.bookings.current();
    if (!booking) {
      return;
    }
    const form = this.form();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats: bookedCells(booking.seats).flatMap((cell) => cell.ids),
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        totalPrice: totalPriceOf(booking.seats),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.bookings.save({ ...booking, paidEmail: form.email });
          this.router.navigate(['/confirmation']);
        },
        error: () => this.toaster.show('Payment failed. Please try again.'),
      });
  }

  back(): void {
    this.router.navigate(['/screenings', this.id(), 'summary']);
  }

  private edit(change: Partial<CheckoutForm>): void {
    const form = { ...this.form(), ...change };
    this.form.set(form);
    const booking = this.bookings.current();
    if (booking) {
      this.bookings.save({ ...booking, checkout: form });
    }
  }
}

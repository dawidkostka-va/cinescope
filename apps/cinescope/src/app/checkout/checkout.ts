import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ApiService } from '../core/api.service';
import { BookingService, CheckoutForm } from '../core/booking.service';
import { tickets } from '../core/auditorium';
import { ToastService } from '../core/toast';

type Field = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';
type Errors = Record<Field, string | null>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

function validate(form: CheckoutForm): Errors {
  return {
    firstName: form.firstName === '' ? 'First name is required' : form.firstName.length < 2 ? 'First name must be at least 2 characters' : null,
    lastName: form.lastName === '' ? 'Last name is required' : form.lastName.length < 2 ? 'Last name must be at least 2 characters' : null,
    email: form.email === '' ? 'Email is required' : EMAIL_PATTERN.test(form.email) ? null : 'Enter a valid email address',
    confirmEmail:
      form.confirmEmail === '' ? 'Confirm email is required' : form.confirmEmail !== form.email ? 'Email addresses do not match' : null,
    phone: form.phone === '' || PHONE_PATTERN.test(form.phone) ? null : 'Phone number must be exactly 9 digits',
    terms: form.terms ? null : 'You must accept the terms and conditions',
  };
}

@Component({
  selector: 'app-checkout',
  imports: [MatButton, MatCheckbox, MatFormField, MatLabel, MatInput],
  templateUrl: './checkout.html',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly form = signal<CheckoutForm>(this.bookingService.booking()?.form ?? {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    terms: false,
  });
  private readonly touched = signal<Partial<Record<Field, boolean>>>({});
  private readonly submitAttempted = signal(false);
  protected readonly submitting = signal(false);

  private readonly errors = computed(() => validate(this.form()));
  protected readonly total = computed(() =>
    tickets(this.bookingService.booking()?.seats ?? []).reduce((sum, ticket) => sum + ticket.price, 0),
  );

  protected shownError(field: Field): string | null {
    return this.submitAttempted() || this.touched()[field] ? this.errors()[field] : null;
  }

  protected setField(field: Exclude<Field, 'terms'>, event: Event): void {
    this.updateForm({ ...this.form(), [field]: (event.target as HTMLInputElement).value });
  }

  protected setTerms(checked: boolean): void {
    this.touched.update((value) => ({ ...value, terms: true }));
    this.updateForm({ ...this.form(), terms: checked });
  }

  protected blur(field: Field): void {
    this.touched.update((value) => ({ ...value, [field]: true }));
  }

  protected back(): void {
    const booking = this.bookingService.booking();
    if (booking) {
      void this.router.navigate(['/screenings', booking.screeningId, 'summary']);
    }
  }

  protected pay(): void {
    this.submitAttempted.set(true);
    const booking = this.bookingService.booking();
    if (!booking) {
      return;
    }
    if (Object.values(this.errors()).some((message) => message !== null)) {
      this.toast.show('The form contains errors');
      return;
    }
    const form = this.form();
    const seats = tickets(booking.seats).flatMap((ticket) => ticket.ids);
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats,
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        totalPrice: this.total(),
      })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.bookingService.update((current) => ({ ...current, paid: true, email: form.email }));
          void this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  private updateForm(form: CheckoutForm): void {
    this.form.set(form);
    this.bookingService.update((booking) => ({ ...booking, form }));
  }
}

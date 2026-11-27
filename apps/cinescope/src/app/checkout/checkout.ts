import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { BookingStore, ticketsFor } from '../booking';
import { CinemaApi } from '../cinema-api.service';
import { formatPrice } from '../pricing';
import { Toast } from '../toast';
import {
  CHECKOUT_FIELDS,
  CheckoutField,
  CheckoutValues,
  EMPTY_CHECKOUT,
  validateCheckout,
} from './checkout-rules';

type TextField = Exclude<CheckoutField, 'terms'>;

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  private readonly bookings = inject(BookingStore);

  /** The route guard ensures a booking in progress exists for this screen. */
  private readonly initial = this.bookings.read();

  readonly formatPrice = formatPrice;

  /** The form values; saved in the booking as they change (section 7.1). */
  readonly values = signal<CheckoutValues>(this.initial?.checkout ?? EMPTY_CHECKOUT);

  /** Fields that have been left at least once, or that `Pay` has marked. */
  private readonly touched = signal<ReadonlySet<CheckoutField>>(new Set());

  /** True while the reservation request is in flight. */
  readonly submitting = signal(false);

  private readonly errors = computed(() => validateCheckout(this.values()));

  readonly total = ticketsFor(this.initial?.seats ?? []).reduce((sum, item) => sum + item.price, 0);

  /** The message of a field, shown only once the field has been left. */
  message(field: CheckoutField): string | null {
    return this.touched().has(field) ? (this.errors()[field] ?? null) : null;
  }

  onInput(field: TextField, event: Event): void {
    this.setValue(field, (event.target as HTMLInputElement).value);
  }

  onTermsChange(checked: boolean): void {
    this.setValue('terms', checked);
    this.touch('terms');
  }

  touch(field: CheckoutField): void {
    this.touched.update((fields) => new Set(fields).add(field));
  }

  /** Validates the form: an invalid form shows every message and sends nothing. */
  pay(): void {
    const booking = this.bookings.read();
    if (!booking || this.submitting()) {
      return;
    }
    this.touched.set(new Set(CHECKOUT_FIELDS));
    const values = this.values();
    if (Object.keys(this.errors()).length > 0) {
      this.toast.show('The form contains errors');
      return;
    }

    const seats = ticketsFor(booking.seats).flatMap((item) => item.seatIds);
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats,
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.total,
      })
      .subscribe({
        next: () => {
          this.bookings.write({ ...booking, checkout: values, paidEmail: values.email });
          void this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  back(): void {
    const booking = this.bookings.read();
    if (booking) {
      void this.router.navigate(['/screenings', booking.screeningId, 'summary']);
    }
  }

  private setValue<K extends keyof CheckoutValues>(field: K, value: CheckoutValues[K]): void {
    const next = { ...this.values(), [field]: value };
    this.values.set(next);
    const booking = this.bookings.read();
    if (booking) {
      this.bookings.write({ ...booking, checkout: next });
    }
  }
}

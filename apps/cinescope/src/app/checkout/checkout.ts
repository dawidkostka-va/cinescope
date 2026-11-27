import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import {
  BookingStore,
  CheckoutValues,
  emptyCheckoutValues,
  formatPrice,
  seatIdentifiers,
  totalPrice,
} from '../booking';
import { CinemaApi } from '../cinema-api';
import { Toast } from '../toast';
import { Field, FIELDS, FieldErrors, TextField, validateCheckout } from './checkout-validation';

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(CinemaApi);
  private readonly bookings = inject(BookingStore);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  /** Bound from the `id` route parameter. */
  readonly id = input.required<string>();

  /** The values typed so far; they live in the booking, so they survive navigation and reloads. */
  protected readonly form = computed<CheckoutValues>(
    () => this.bookings.booking()?.form ?? emptyCheckoutValues(),
  );

  protected readonly total = computed(() => totalPrice(this.bookings.booking()?.items ?? []));

  protected readonly payLabel = computed(() => `Pay ${formatPrice(this.total())}`);

  private readonly errors = computed<FieldErrors>(() => validateCheckout(this.form()));

  /** Fields the customer has left; a message is shown only for these. */
  private readonly touched = signal<ReadonlySet<Field>>(new Set());

  /** True while the payment request is in flight. */
  protected readonly pending = signal(false);

  /** The message to show under a field, if it has been left and its rule fails. */
  protected error(field: Field): string | undefined {
    return this.touched().has(field) ? this.errors()[field] : undefined;
  }

  protected touch(field: Field): void {
    this.touched.update((fields) => new Set(fields).add(field));
  }

  protected setText(field: TextField, event: Event): void {
    this.bookings.updateForm(field, (event.target as HTMLInputElement).value);
  }

  protected setTerms(accepted: boolean): void {
    this.bookings.updateForm('terms', accepted);
    this.touch('terms');
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id(), 'summary']);
  }

  /** Sends the reservation; on success the booking is paid and the confirmation opens. */
  protected async pay(): Promise<void> {
    const booking = this.bookings.booking();
    if (!booking || this.pending()) {
      return;
    }
    if (Object.keys(this.errors()).length > 0) {
      this.touched.set(new Set(FIELDS));
      this.toast.show('The form contains errors');
      return;
    }

    const values = this.form();
    this.pending.set(true);
    try {
      await this.api.createReservation({
        screeningId: booking.screeningId,
        seats: booking.items.flatMap(seatIdentifiers),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.total(),
      });
    } catch {
      this.pending.set(false);
      this.toast.show('Payment failed. Please try again.');
      return;
    }
    this.bookings.markPaid(values.email);
    this.router.navigate(['/confirmation']);
  }
}

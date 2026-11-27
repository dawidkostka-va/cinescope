import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Router } from '@angular/router';
import { BookedSeat, BookingService, CheckoutValues, sortSeats } from '../booking';
import { CinescopeApi } from '../cinescope-api';
import { seatId } from '../seat-selection/auditorium';
import { formatPrice, priceOf } from '../pricing';
import { ToastService } from '../toast';
import { CheckoutField, EMPTY_CHECKOUT, checkoutErrors, isValidCheckout } from './checkout-form';

type TextField = Exclude<keyof CheckoutValues, 'termsAccepted'>;

const ALL_FIELDS: ReadonlySet<CheckoutField> = new Set<CheckoutField>([
  'firstName',
  'lastName',
  'email',
  'confirmEmail',
  'phone',
  'terms',
]);

/** Seat identifiers of a seat, or both identifiers of a couch (section 2.1). */
function seatIdentifiers(seat: BookedSeat): string[] {
  return seat.kind === 'couch'
    ? [seatId(seat.row, seat.column), seatId(seat.row, seat.columnEnd)]
    : [seatId(seat.row, seat.column)];
}

function totalOf(seats: readonly BookedSeat[]): number {
  return seats.reduce((sum, seat) => sum + priceOf(seat), 0);
}

@Component({
  selector: 'app-checkout',
  imports: [MatButton, MatCheckbox, MatFormField, MatInput, MatLabel],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(CinescopeApi);
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** The booking in progress; the route guard guarantees it is unpaid and holds seats for this screening. */
  private readonly booking = this.bookings.current();

  protected readonly total = formatPrice(totalOf(this.booking?.seats ?? []));

  /** The form values, restored from the booking so they survive going back and reloading. */
  protected readonly values = signal<CheckoutValues>(this.booking?.checkout ?? EMPTY_CHECKOUT);

  /** Fields the customer has left (or, for the terms checkbox, toggled). Messages show only for these. */
  private readonly touched = signal<ReadonlySet<CheckoutField>>(new Set());

  private readonly errors = computed(() => checkoutErrors(this.values()));

  /** True while the reservation request is in flight. */
  protected readonly paying = signal(false);

  /** The message of a field, shown only once the field has been left. */
  protected errorOf(field: CheckoutField): string | null {
    return this.touched().has(field) ? this.errors()[field] : null;
  }

  protected setText(field: TextField, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.update({ ...this.values(), [field]: value });
  }

  protected setTerms(accepted: boolean): void {
    this.touch('terms');
    this.update({ ...this.values(), termsAccepted: accepted });
  }

  protected touch(field: CheckoutField): void {
    this.touched.update((fields) => new Set(fields).add(field));
  }

  /** Back returns to the summary with the booking intact. */
  protected back(): void {
    if (this.booking) {
      void this.router.navigate(['/screenings', this.booking.screeningId, 'summary']);
    }
  }

  /**
   * Pays: an invalid form shows every message and sends nothing; a valid one sends the reservation
   * and, on success, marks the booking paid and opens the confirmation.
   */
  protected pay(): void {
    const booking = this.booking;
    if (!booking || this.paying()) {
      return;
    }
    this.touched.set(ALL_FIELDS);
    const values = this.values();
    if (!isValidCheckout(this.errors())) {
      this.toast.show('The form contains errors');
      return;
    }

    this.paying.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats: sortSeats(booking.seats).flatMap(seatIdentifiers),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: totalOf(booking.seats),
      })
      .then(
        () => {
          this.paying.set(false);
          this.bookings.markPaid(values.email);
          void this.router.navigate(['/confirmation']);
        },
        () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      );
  }

  /** Keeps every change of the form in the booking, so it survives going back and reloading. */
  private update(values: CheckoutValues): void {
    this.values.set(values);
    this.bookings.saveCheckout(values);
  }
}

import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { API_URL } from '../api';
import { BookingService } from '../booking';
import { NewReservation, Reservation } from '../models';
import { ToastService } from '../toast';
import { formatPrice, ticketsOf, totalOf } from '../tickets';
import { CheckoutField, checkoutErrorMessage, createCheckoutForm } from './checkout-form';

const FORM_ERRORS_MESSAGE = 'The form contains errors';
const PAYMENT_FAILED_MESSAGE = 'Payment failed. Please try again.';

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
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);

  /** The guard only opens this screen for an unpaid booking, so it is present here. */
  private readonly stored = this.booking.current();
  private readonly tickets = ticketsOf(this.stored?.seats ?? []);
  protected readonly total = totalOf(this.tickets);

  protected readonly form = createCheckoutForm(this.stored?.checkout);
  protected readonly submitting = signal(false);
  protected readonly payLabel = computed(() =>
    this.submitting() ? 'Processing…' : `Pay ${formatPrice(this.total)}`,
  );

  constructor() {
    // Every change is kept in the booking, so the values survive going back and reloading.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.saveValues());
  }

  /** The message of a field, or null when it is valid or has not been left yet. */
  protected error(field: CheckoutField): string | null {
    return checkoutErrorMessage(this.form, field);
  }

  protected back(): void {
    const screeningId = this.booking.current()?.screeningId;
    if (screeningId !== undefined) {
      void this.router.navigate(['/screenings', screeningId, 'summary']);
    }
  }

  protected pay(): void {
    if (this.submitting()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.show(FORM_ERRORS_MESSAGE);
      return;
    }

    const booking = this.booking.current();
    if (!booking) {
      void this.router.navigateByUrl('/');
      return;
    }

    const values = this.form.getRawValue();
    const reservation: NewReservation = {
      screeningId: booking.screeningId,
      seats: this.tickets.flatMap((ticket) => ticket.seatIds),
      customer: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      },
      totalPrice: this.total,
    };

    this.submitting.set(true);
    this.http.post<Reservation>(`${API_URL}/reservations`, reservation).subscribe({
      next: () => {
        this.booking.save({ ...booking, checkout: values, paidEmail: values.email });
        void this.router.navigateByUrl('/confirmation');
      },
      error: () => {
        this.submitting.set(false);
        this.toast.show(PAYMENT_FAILED_MESSAGE);
      },
    });
  }

  private saveValues(): void {
    const current = this.booking.current();
    if (current) {
      this.booking.save({ ...current, checkout: this.form.getRawValue() });
    }
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../core/api.service';
import { BookingService, CheckoutForm, emptyCheckoutForm } from '../core/booking.service';
import { formatPrice, unitPrice } from '../core/pricing';
import { bookingTotal, sortSeatIds } from '../core/seat-units';
import { ToastService } from '../core/toast.service';
import { CheckoutErrors, CheckoutField, hasErrors, validateCheckout } from './checkout-validation';

type TextField = Exclude<CheckoutField, 'terms'>;

const ALL_FIELDS: CheckoutField[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly bookings = inject(BookingService);

  readonly form = computed<CheckoutForm>(() => this.bookings.booking()?.form ?? emptyCheckoutForm());
  readonly errors = computed<CheckoutErrors>(() => validateCheckout(this.form()));
  readonly touched = signal<ReadonlySet<CheckoutField>>(new Set());
  readonly submitting = signal(false);
  readonly payLabel = computed(() => {
    const seats = this.bookings.booking()?.seats ?? [];
    return `Pay ${formatPrice(bookingTotal(seats, unitPrice))}`;
  });

  shown(field: CheckoutField): string | undefined {
    return this.touched().has(field) ? this.errors()[field] : undefined;
  }

  setText(field: TextField, value: string): void {
    this.bookings.setForm({ ...this.form(), [field]: value });
  }

  setTerms(checked: boolean): void {
    this.bookings.setForm({ ...this.form(), terms: checked });
    this.markTouched('terms');
  }

  markTouched(field: CheckoutField): void {
    this.touched.set(new Set([...this.touched(), field]));
  }

  back(): void {
    const booking = this.bookings.booking();
    this.router.navigate(['/screenings', booking?.screeningId, 'summary']);
  }

  pay(): void {
    const booking = this.bookings.booking();
    if (!booking) {
      return;
    }
    this.touched.set(new Set(ALL_FIELDS));
    const form = this.form();
    if (hasErrors(validateCheckout(form))) {
      this.toast.show('The form contains errors');
      return;
    }
    this.submitting.set(true);
    this.api
      .reserve({
        screeningId: booking.screeningId,
        seats: sortSeatIds(booking.seats),
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        totalPrice: bookingTotal(booking.seats, unitPrice),
      })
      .subscribe({
        next: () => {
          this.bookings.markPaid(form.email);
          this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

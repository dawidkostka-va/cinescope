import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService, CheckoutFormValues, EMPTY_FORM } from '../../core/booking.service';
import { injectResolvedScreening } from '../../core/screening-resolver';
import { couchIds, formatPrice, seatId, toSeatUnits, totalPrice } from '../../core/seat.util';
import { ToastService } from '../../core/toast.service';
import { computeCheckoutErrors } from './checkout.validation';

type TouchedState = Record<keyof CheckoutFormValues, boolean>;

const NOT_TOUCHED: TouchedState = {
  firstName: false,
  lastName: false,
  email: false,
  confirmEmail: false,
  phone: false,
  termsAccepted: false,
};

const ALL_TOUCHED: TouchedState = {
  firstName: true,
  lastName: true,
  email: true,
  confirmEmail: true,
  phone: true,
  termsAccepted: true,
};

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  private readonly data = injectResolvedScreening();

  readonly screening = computed(() => this.data().screening);

  private readonly booking = this.bookingService.booking;
  readonly values = computed(() => this.booking()?.form ?? EMPTY_FORM);
  readonly errors = computed(() => computeCheckoutErrors(this.values()));

  readonly touched = signal<TouchedState>(NOT_TOUCHED);
  readonly submitting = signal(false);

  readonly payLabel = computed(() => `Pay ${formatPrice(totalPrice(this.booking()?.seats ?? []))}`);

  fieldError(field: keyof CheckoutFormValues): string | null {
    return this.touched()[field] ? (this.errors()[field] ?? null) : null;
  }

  update<K extends keyof CheckoutFormValues>(field: K, value: CheckoutFormValues[K]): void {
    this.bookingService.updateForm({ [field]: value } as Partial<CheckoutFormValues>);
  }

  markTouched(field: keyof CheckoutFormValues): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  onTermsChange(checked: boolean): void {
    this.update('termsAccepted', checked);
    this.markTouched('termsAccepted');
  }

  back(): void {
    this.router.navigate(['/screenings', this.screening().id, 'summary']);
  }

  pay(): void {
    const hasErrors = Object.values(this.errors()).some(Boolean);
    if (hasErrors) {
      this.touched.set(ALL_TOUCHED);
      this.toast.show('The form contains errors');
      return;
    }

    this.submitting.set(true);
    const values = this.values();
    const seats = this.booking()?.seats ?? [];
    const total = totalPrice(seats);
    const orderedSeats = toSeatUnits(seats).flatMap((unit) =>
      unit.type === 'couch'
        ? couchIds(unit.row, unit.columnStart as number, unit.columnEnd as number)
        : [seatId(unit.row, unit.column as number)],
    );

    this.api
      .createReservation({
        screeningId: this.screening().id,
        seats: orderedSeats,
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: total,
      })
      .subscribe({
        next: () => {
          this.bookingService.markPaid(values.email);
          this.submitting.set(false);
          this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

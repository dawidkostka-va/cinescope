import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { API_URL } from '../api';
import { BookingService, EMPTY_CHECKOUT } from '../booking/booking.service';
import { CheckoutValues, Reservation } from '../models';
import { bookingTotal, formatPrice } from '../seat-map/pricing';
import { selectionUnits } from '../seat-map/selection';
import { ToastService } from '../toast/toast.service';
import { CheckoutErrors, CheckoutField, validateCheckout } from './checkout.validation';

const FIELDS: CheckoutField[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly router = inject(Router);
  private readonly bookings = inject(BookingService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly initial: CheckoutValues = this.bookings.booking()?.checkout ?? EMPTY_CHECKOUT;
  private readonly values = signal<CheckoutValues>(this.initial);
  private readonly touched = signal<ReadonlySet<CheckoutField>>(new Set());
  private readonly errors = computed<CheckoutErrors>(() => validateCheckout(this.values()));
  protected readonly submitting = signal(false);
  protected readonly totalLabel = computed(() =>
    formatPrice(bookingTotal(this.bookings.booking()?.seats ?? [])),
  );

  protected errorOf(field: CheckoutField): string | null {
    return this.touched().has(field) ? this.errors()[field] : null;
  }

  protected setValue<K extends Exclude<CheckoutField, 'terms'>>(field: K, value: string): void {
    this.save({ ...this.values(), [field]: value });
  }

  protected setTerms(checked: boolean): void {
    this.save({ ...this.values(), terms: checked });
    this.touch('terms');
  }

  protected touch(field: CheckoutField): void {
    this.touched.update((fields) => new Set([...fields, field]));
  }

  protected back(): void {
    this.router.navigateByUrl(`/screenings/${this.bookings.booking()?.screeningId}/summary`);
  }

  protected pay(): void {
    this.touched.set(new Set(FIELDS));
    if (Object.values(this.errors()).some((error) => error !== null)) {
      this.toast.show('The form contains errors');
      return;
    }

    const booking = this.bookings.booking();
    if (!booking) {
      return;
    }
    const values = this.values();
    const reservation: Omit<Reservation, 'id'> = {
      screeningId: booking.screeningId,
      seats: selectionUnits(new Set(booking.seats)).flatMap((unit) => unit.ids),
      customer: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      },
      totalPrice: bookingTotal(booking.seats),
    };

    this.submitting.set(true);
    this.http
      .post<Reservation>(`${API_URL}/reservations`, reservation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.bookings.markPaid(values.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  private save(values: CheckoutValues): void {
    this.values.set(values);
    this.bookings.setCheckout(values);
  }
}

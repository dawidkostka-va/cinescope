import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { cellsForIds, sortByPosition } from '../auditorium';
import { readBooking, writeBooking } from '../booking';
import { CinemaApi } from '../cinema-api';
import { formatPrice, priceOf } from '../pricing';
import { Toaster } from '../toast/toaster';
import { Field, validate } from './validation';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);

  private readonly booking = readBooking();
  private readonly totalPrice = cellsForIds(this.booking?.itemIds ?? []).reduce(
    (total, cell) => total + priceOf(cell),
    0,
  );

  protected readonly payLabel = `Pay ${formatPrice(this.totalPrice)}`;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: this.booking?.customer.firstName ?? '',
    lastName: this.booking?.customer.lastName ?? '',
    email: this.booking?.customer.email ?? '',
    confirmEmail: this.booking?.customer.confirmEmail ?? '',
    phone: this.booking?.customer.phone ?? '',
    terms: this.booking?.customer.terms ?? false,
  });

  protected readonly values = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  private readonly touched = signal<ReadonlySet<Field>>(new Set());
  private readonly errors = computed(() => validate(this.values()));

  protected readonly submitting = signal(false);

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.saveCustomer());
  }

  protected shown(field: Field): string | null {
    return this.touched().has(field) ? this.errors()[field] : null;
  }

  protected touch(field: Field): void {
    this.touched.update((fields) => new Set(fields).add(field));
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.booking?.screeningId ?? '', 'summary']);
  }

  protected pay(): void {
    const fields: Field[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];
    this.touched.set(new Set(fields));
    if (Object.values(this.errors()).some((message) => message !== null)) {
      this.toaster.show('The form contains errors');
      return;
    }

    const booking = readBooking();
    if (!booking) {
      return;
    }
    const customer = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats: sortByPosition(cellsForIds(booking.itemIds)).flatMap((cell) => cell.ids),
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
        },
        totalPrice: this.totalPrice,
      })
      .subscribe({
        next: () => {
          writeBooking({ ...booking, customer, paidEmail: customer.email });
          void this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toaster.show('Payment failed. Please try again.');
        },
      });
  }

  private saveCustomer(): void {
    const booking = readBooking();
    if (booking) {
      writeBooking({ ...booking, customer: this.form.getRawValue() });
    }
  }
}

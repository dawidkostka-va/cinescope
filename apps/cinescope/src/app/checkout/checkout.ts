import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { BookingService, sortedUnits, unitSeatIds } from '../booking.service';
import { CinemaApi } from '../cinema-api';
import { formatPrice, totalOf } from '../pricing';
import { ToastService } from '../toast/toast.service';
import { CheckoutField, validateCheckout } from './checkout-validation';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';

const EVERY_FIELD: Record<CheckoutField, boolean> = {
  firstName: true,
  lastName: true,
  email: true,
  confirmEmail: true,
  phone: true,
  terms: true,
};

@Component({
  selector: 'app-checkout',
  imports: [MatButton, MatCheckbox, MatFormField, MatInput, MatLabel],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly screeningId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { requireSync: true },
  );

  protected readonly form = this.booking.form;
  protected readonly total = computed(() => formatPrice(totalOf(this.booking.units())));
  protected readonly submitting = signal(false);

  private readonly errors = computed(() => validateCheckout(this.form()));
  private readonly left = signal<Partial<Record<CheckoutField, boolean>>>({});

  protected message(field: CheckoutField): string | undefined {
    return this.left()[field] ? this.errors()[field] : undefined;
  }

  protected typed(field: TextField, event: Event): void {
    this.booking.updateForm(field, (event.target as HTMLInputElement).value);
  }

  protected leave(field: CheckoutField): void {
    this.left.update((left) => ({ ...left, [field]: true }));
  }

  protected toggleTerms(checked: boolean): void {
    this.booking.updateForm('terms', checked);
    this.leave('terms');
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  protected pay(): void {
    if (Object.values(this.errors()).some((message) => message !== undefined)) {
      this.left.set(EVERY_FIELD);
      this.toast.show('The form contains errors');
      return;
    }
    const form = this.form();
    const units = this.booking.units();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: this.screeningId(),
        seats: sortedUnits(units).flatMap(unitSeatIds),
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        totalPrice: totalOf(units),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(form.email);
          void this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { cellIds, compareCells } from '../core/auditorium';
import { BookingService } from '../core/booking.service';
import { CHECKOUT_FIELDS, CheckoutField, CheckoutValues, validateCheckout } from '../core/checkout';
import { formatPrice } from '../core/pricing';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(ToastService);
  private readonly booking = inject(BookingService);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  readonly values = this.booking.form;
  readonly errors = computed(() => validateCheckout(this.values()));
  readonly touched = signal<ReadonlySet<CheckoutField>>(new Set());
  readonly submitting = signal(false);
  readonly payLabel = computed(() => `Pay ${formatPrice(this.booking.total())}`);

  error(field: CheckoutField): string | undefined {
    return this.touched().has(field) ? this.errors()[field] : undefined;
  }

  update<K extends CheckoutField>(field: K, value: CheckoutValues[K]): void {
    this.booking.updateForm({ ...this.values(), [field]: value });
  }

  touch(field: CheckoutField): void {
    this.touched.update((fields) => new Set(fields).add(field));
  }

  back(): void {
    this.router.navigate(['/screenings', this.params().get('id'), 'summary']);
  }

  async pay(): Promise<void> {
    if (Object.keys(this.errors()).length > 0) {
      this.touched.set(new Set(CHECKOUT_FIELDS));
      this.toasts.show('The form contains errors');
      return;
    }
    const values = this.values();
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.api.createReservation({
          screeningId: this.booking.screeningId() as number,
          seats: [...this.booking.seats()].sort(compareCells).flatMap(cellIds),
          customer: {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
          },
          totalPrice: this.booking.total(),
        }),
      );
      this.booking.markPaid(values.email);
      await this.router.navigate(['/confirmation']);
    } catch {
      this.submitting.set(false);
      this.toasts.show('Payment failed. Please try again.');
    }
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { CinemaApi } from '../core/api';
import { BookingService, CustomerForm, emptyForm } from '../core/booking';
import { formatPrice } from '../core/format';
import { groupIntoUnits } from '../core/seats';
import { ToastService } from '../core/toast';
import { FieldErrors, FieldKey, validateForm } from './validation';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';

const ALL_FIELDS: FieldKey[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];

function untouched(): Record<FieldKey, boolean> {
  return Object.fromEntries(ALL_FIELDS.map((field) => [field, false])) as Record<FieldKey, boolean>;
}

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly id = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))), {
    requireSync: true,
  });

  protected readonly form = computed<CustomerForm>(() => this.bookingService.booking()?.form ?? emptyForm());
  private readonly units = computed(() => groupIntoUnits(this.bookingService.booking()?.seats ?? []));
  protected readonly total = computed(() => this.units().reduce((sum, unit) => sum + unit.price, 0));
  protected readonly touched = signal(untouched());
  protected readonly inFlight = signal(false);
  protected readonly errors = computed<FieldErrors>(() => validateForm(this.form()));
  protected readonly payLabel = computed(() =>
    this.inFlight() ? 'Processing…' : `Pay ${formatPrice(this.total())}`,
  );

  protected messageFor(field: FieldKey): string | null {
    return this.touched()[field] ? this.errors()[field] : null;
  }

  protected setText(field: TextField, event: Event): void {
    this.patch({ [field]: (event.target as HTMLInputElement).value });
  }

  protected setTerms(checked: boolean): void {
    this.patch({ terms: checked });
    this.markTouched('terms');
  }

  protected markTouched(field: FieldKey): void {
    this.touched.update((state) => ({ ...state, [field]: true }));
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.id(), 'summary']);
  }

  protected pay(): void {
    const booking = this.bookingService.booking();
    if (!booking || this.inFlight()) {
      return;
    }
    if (Object.values(this.errors()).some((message) => message !== null)) {
      this.touched.set(Object.fromEntries(ALL_FIELDS.map((field) => [field, true])) as Record<FieldKey, boolean>);
      this.toast.show('The form contains errors');
      return;
    }
    const { form } = booking;
    this.inFlight.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats: this.units().flatMap((unit) => unit.ids),
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        totalPrice: this.total(),
      })
      .subscribe({
        next: () => {
          const latest = this.bookingService.booking();
          if (latest) {
            this.bookingService.save({ ...latest, paidEmail: form.email });
          }
          void this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.inFlight.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  private patch(changes: Partial<CustomerForm>): void {
    const booking = this.bookingService.booking();
    if (booking) {
      this.bookingService.save({ ...booking, form: { ...booking.form, ...changes } });
    }
  }
}

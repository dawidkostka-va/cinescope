import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { BookingStore, CheckoutValues } from '../booking/booking.store';
import { formatPrice, ticketsFor } from '../booking/tickets';
import { CinemaApi } from '../cinema.api';
import { Toast } from '../toast/toast';
import { CheckoutErrors, CheckoutField, validateCheckout } from './checkout.validation';

type TextField = Exclude<CheckoutField, 'terms'>;

const ALL_FIELDS: CheckoutField[] = [
  'firstName',
  'lastName',
  'email',
  'confirmEmail',
  'phone',
  'terms',
];

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkout {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly booking = inject(BookingStore);
  private readonly toast = inject(Toast);

  readonly formatPrice = formatPrice;
  readonly values = computed<CheckoutValues>(() => this.booking.booking()?.form ?? emptyValues());
  readonly tickets = computed(() => ticketsFor(this.booking.booking()?.seats ?? []));
  readonly total = computed(() => this.tickets().reduce((sum, ticket) => sum + ticket.price, 0));
  readonly errors = computed<CheckoutErrors>(() => validateCheckout(this.values()));

  private readonly touched = signal<Partial<Record<CheckoutField, boolean>>>({});
  readonly submitting = signal(false);

  shownError(field: CheckoutField): string | undefined {
    return this.touched()[field] ? this.errors()[field] : undefined;
  }

  touch(field: CheckoutField): void {
    this.touched.update((state) => ({ ...state, [field]: true }));
  }

  patch(field: TextField, value: string): void {
    this.booking.setForm({ [field]: value });
  }

  setTerms(checked: boolean): void {
    this.booking.setForm({ terms: checked });
    this.touch('terms');
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  back(): void {
    const bookingState = this.booking.booking();
    if (bookingState) {
      void this.router.navigateByUrl(`/screenings/${bookingState.screeningId}/summary`);
    }
  }

  pay(): void {
    const current = this.booking.booking();
    if (!current || this.submitting()) {
      return;
    }
    this.touched.set(Object.fromEntries(ALL_FIELDS.map((field) => [field, true])));
    if (Object.keys(this.errors()).length > 0) {
      this.toast.show('The form contains errors');
      return;
    }

    const values = this.values();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: current.screeningId,
        seats: this.tickets().flatMap((ticket) => ticket.ids),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.total(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.booking.markPaid(values.email);
          void this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

function emptyValues(): CheckoutValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { bookedItems, BookingService, CheckoutValues, formatPrice } from '../booking';
import { CinemaApi } from '../cinema-api';
import { ToastService } from '../toast/toast';
import {
  CHECKOUT_FIELDS,
  CheckoutErrors,
  CheckoutField,
  EMPTY_CHECKOUT,
  hasErrors,
  validateCheckout,
} from './checkout-rules';

type TextField = Exclude<CheckoutField, 'terms'>;

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent {
  private readonly api = inject(CinemaApi);
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly formatPrice = formatPrice;

  protected readonly details = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) =>
        this.api.screeningWithMovie(Number(params.get('id'))).pipe(
          catchError(() => {
            this.router.navigateByUrl('/');
            return EMPTY;
          }),
        ),
      ),
    ),
  );

  private readonly selection = signal<string[]>(this.bookings.get()?.selection ?? []);
  protected readonly total = computed(() =>
    bookedItems(this.selection()).reduce((sum, item) => sum + item.price, 0),
  );

  protected readonly values = signal<CheckoutValues>(this.bookings.get()?.form ?? EMPTY_CHECKOUT);
  private readonly touched = signal<ReadonlySet<CheckoutField>>(new Set());
  private readonly errors = computed<CheckoutErrors>(() => validateCheckout(this.values()));
  protected readonly paying = signal(false);

  protected errorFor(field: CheckoutField): string | undefined {
    return this.touched().has(field) ? this.errors()[field] : undefined;
  }

  protected setText(field: TextField, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.update({ ...this.values(), [field]: value });
  }

  protected setTerms(checked: boolean): void {
    this.touch('terms');
    this.update({ ...this.values(), terms: checked });
  }

  protected touch(field: CheckoutField): void {
    this.touched.set(new Set([...this.touched(), field]));
  }

  protected back(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'summary']);
  }

  protected pay(screeningId: number): void {
    this.touched.set(new Set(CHECKOUT_FIELDS));
    if (hasErrors(this.errors())) {
      this.toast.show('The form contains errors');
      return;
    }
    const values = this.values();
    this.paying.set(true);
    this.api
      .createReservation({
        screeningId,
        seats: bookedItems(this.selection()).flatMap((item) => item.key.split('-')),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.total(),
      })
      .subscribe({
        next: () => {
          const booking = this.bookings.get();
          if (booking) {
            this.bookings.save({ ...booking, paidEmail: values.email });
          }
          this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  private update(values: CheckoutValues): void {
    this.values.set(values);
    const booking = this.bookings.get();
    if (booking) {
      this.bookings.save({ ...booking, form: values });
    }
  }
}

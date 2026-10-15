import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService, CheckoutFormValues } from '../../core/booking.service';
import { CheckoutFieldErrors, validateCheckoutForm } from '../../core/checkout-validation';
import { formatPrice, seatIdsInSummaryOrder, totalPrice } from '../../core/seat-utils';
import { ToastService } from '../../core/toast.service';

type TouchedState = Record<keyof CheckoutFormValues, boolean>;

function allUntouched(): TouchedState {
  return { firstName: false, lastName: false, email: false, confirmEmail: false, phone: false, termsAccepted: false };
}

function allTouched(): TouchedState {
  return { firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, termsAccepted: true };
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  protected readonly form = this.fb.group({
    firstName: [''],
    lastName: [''],
    email: [''],
    confirmEmail: [''],
    phone: [''],
    termsAccepted: [false],
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly touched = signal<TouchedState>(allUntouched());
  protected readonly errors = computed<CheckoutFieldErrors>(() => validateCheckoutForm(this.formValue() as CheckoutFormValues));

  protected readonly submitting = signal(false);

  protected readonly total = computed(() => formatPrice(totalPrice(this.bookingService.booking()?.seats ?? [])));

  constructor() {
    const savedForm = this.bookingService.booking()?.form;
    if (savedForm) {
      this.form.patchValue(savedForm, { emitEvent: false });
    }

    effect(() => {
      this.bookingService.updateForm(this.formValue() as CheckoutFormValues);
    });
  }

  protected markTouched(field: keyof CheckoutFormValues): void {
    this.touched.update((current) => ({ ...current, [field]: true }));
  }

  protected showError(field: keyof CheckoutFormValues): string | null {
    return this.touched()[field] ? (this.errors()[field] ?? null) : null;
  }

  protected onPay(): void {
    const errors = this.errors();
    if (Object.keys(errors).length > 0) {
      this.touched.set(allTouched());
      this.toast.show('The form contains errors');
      return;
    }

    const booking = this.bookingService.booking();
    if (!booking) {
      return;
    }

    const value = this.formValue() as CheckoutFormValues;
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: this.screeningId(),
        seats: seatIdsInSummaryOrder(booking.seats),
        customer: {
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          phone: value.phone,
        },
        totalPrice: totalPrice(booking.seats),
      })
      .subscribe({
        next: () => {
          this.bookingService.markPaid(value.email);
          this.submitting.set(false);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }
}

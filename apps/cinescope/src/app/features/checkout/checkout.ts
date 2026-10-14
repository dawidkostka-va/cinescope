import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingFormValues } from '../../core/models/booking.model';
import { formatPrice, toBookingItems, totalPrice, flattenItemIds } from '../../core/models/seat.model';
import { BookingService } from '../../core/services/booking.service';
import { ReservationsApiService } from '../../core/services/reservations-api.service';
import { ToastService } from '../../core/services/toast.service';
import { confirmEmailValidator, emailFormatValidator, phoneValidator } from './checkout-validators';

type FieldName = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';

const REQUIRED_MESSAGES: Record<FieldName, string> = {
  firstName: 'First name is required',
  lastName: 'Last name is required',
  email: 'Email is required',
  confirmEmail: 'Confirm email is required',
  phone: 'Phone number is required',
  terms: 'You must accept the terms and conditions',
};

const MIN_LENGTH_MESSAGES: Partial<Record<FieldName, string>> = {
  firstName: 'First name must be at least 2 characters',
  lastName: 'Last name must be at least 2 characters',
};

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly reservationsApi = inject(ReservationsApiService);
  private readonly toast = inject(ToastService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, emailFormatValidator]],
    confirmEmail: ['', [Validators.required, confirmEmailValidator]],
    phone: ['', [phoneValidator]],
    terms: [false, [Validators.requiredTrue]],
  });

  protected readonly total = computed(() => formatPrice(totalPrice(toBookingItems(this.bookingService.seats()))));
  protected readonly payLabel = computed(() => (this.submitting() ? 'Processing…' : `Pay ${this.total()}`));

  constructor() {
    const initial = this.bookingService.booking()?.form;
    if (initial) {
      this.form.patchValue(initial, { emitEvent: false });
    }

    this.form.valueChanges.subscribe((value) => {
      this.bookingService.updateForm(value as BookingFormValues);
    });

    this.form.controls.email.valueChanges.subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity({ onlySelf: true });
    });
  }

  protected fieldError(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    if (control.errors['required']) return REQUIRED_MESSAGES[name];
    if (control.errors['minlength']) return MIN_LENGTH_MESSAGES[name] ?? null;
    if (control.errors['emailFormat']) return 'Enter a valid email address';
    if (control.errors['mismatch']) return 'Email addresses do not match';
    if (control.errors['invalidPhone']) return 'Phone number must be exactly 9 digits';
    return null;
  }

  protected onTermsChange(): void {
    this.form.controls.terms.markAsTouched();
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }

    const value = this.form.getRawValue();
    const items = toBookingItems(this.bookingService.seats());

    this.submitting.set(true);
    this.reservationsApi
      .create({
        screeningId: this.screeningId(),
        seats: flattenItemIds(items),
        customer: {
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          phone: value.phone,
        },
        totalPrice: totalPrice(items),
      })
      .subscribe({
        next: () => {
          this.bookingService.markPaid(value.email);
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

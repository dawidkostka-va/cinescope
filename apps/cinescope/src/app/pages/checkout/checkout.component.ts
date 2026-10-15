import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { ReservationsService } from '../../core/services/reservations.service';
import { ToastService } from '../../core/services/toast.service';
import { CheckoutFormValues } from '../../core/models/booking.model';
import { ReservationRequest } from '../../core/models/reservation.model';
import { groupSeats, sortSeatsForSummary } from '../../shared/seat-grouping';
import { formatPrice } from '../../shared/seat-pricing';

const PHONE_PATTERN = /^\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailFormatValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) {
    return null;
  }
  return EMAIL_PATTERN.test(value) ? null : { emailFormat: true };
}

function confirmEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) {
    return null;
  }
  const email = control.parent?.get('email')?.value as string | undefined;
  return value === email ? null : { mismatch: true };
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly reservationsService = inject(ReservationsService);
  private readonly toastService = inject(ToastService);

  protected readonly formatPrice = formatPrice;

  private readonly screeningId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: NaN },
  );

  readonly booking = this.bookingService.booking;
  readonly submitting = signal(false);

  readonly total = computed(() => groupSeats(this.booking()?.seats ?? []).reduce((sum, item) => sum + item.price, 0));

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, emailFormatValidator]],
    confirmEmail: ['', [Validators.required, confirmEmailValidator]],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    termsAccepted: [false, [Validators.requiredTrue]],
  });

  constructor() {
    const current = this.booking();
    if (current) {
      this.form.patchValue(current.form, { emitEvent: false });
    }

    this.form.valueChanges.subscribe((value) => {
      this.bookingService.updateForm(value as CheckoutFormValues);
    });

    this.form.controls.email.valueChanges.subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  fieldError(name: keyof CheckoutFormValues, requiredMessage: string, errorKey: string, errorMessage: string): string | null {
    const control = this.form.controls[name];
    if (!control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return requiredMessage;
    }
    if (control.hasError(errorKey)) {
      return errorMessage;
    }
    return null;
  }

  touchTerms(): void {
    this.form.controls.termsAccepted.markAsTouched();
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  pay(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.show('The form contains errors');
      return;
    }

    const booking = this.booking();
    if (!booking) {
      return;
    }

    const value = this.form.getRawValue();
    const payload: ReservationRequest = {
      screeningId: booking.screeningId,
      seats: sortSeatsForSummary(booking.seats),
      customer: {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phone: value.phone,
      },
      totalPrice: this.total(),
    };

    this.submitting.set(true);
    this.reservationsService.createReservation(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.bookingService.markPaid(value.email);
        this.router.navigateByUrl('/confirmation');
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.show('Payment failed. Please try again.');
      },
    });
  }
}

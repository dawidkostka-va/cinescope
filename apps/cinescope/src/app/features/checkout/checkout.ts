import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { CheckoutFormValues, ScreeningData } from '../../core/models';
import { buildBookingItems, sortSeatIds } from '../../core/seat.util';
import { ToastService } from '../../core/toast.service';
import { isValidEmail, isValidPhone } from '../../core/validation.util';

type FieldKey = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'termsAccepted';

function firstNameError(value: string): string | null {
  if (value.length === 0) return 'First name is required';
  if (value.length < 2) return 'First name must be at least 2 characters';
  return null;
}

function lastNameError(value: string): string | null {
  if (value.length === 0) return 'Last name is required';
  if (value.length < 2) return 'Last name must be at least 2 characters';
  return null;
}

function emailError(value: string): string | null {
  if (value.length === 0) return 'Email is required';
  if (!isValidEmail(value)) return 'Enter a valid email address';
  return null;
}

function confirmEmailError(value: string, email: string): string | null {
  if (value.length === 0) return 'Confirm email is required';
  if (value !== email) return 'Email addresses do not match';
  return null;
}

function phoneError(value: string): string | null {
  if (value.length === 0) return null;
  if (!isValidPhone(value)) return 'Phone number must be exactly 9 digits';
  return null;
}

function termsError(checked: boolean): string | null {
  return checked ? null : 'You must accept the terms and conditions';
}

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatCheckboxModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  private readonly dataSignal = signal<ScreeningData | null>(null);
  readonly data = this.dataSignal.asReadonly();

  readonly form = computed<CheckoutFormValues>(
    () =>
      this.bookingService.booking()?.form ?? {
        firstName: '',
        lastName: '',
        email: '',
        confirmEmail: '',
        phone: '',
        termsAccepted: false,
      },
  );

  private readonly touched = signal<Record<FieldKey, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    termsAccepted: false,
  });
  private readonly submitted = signal(false);

  readonly processing = signal(false);

  readonly total = computed(() =>
    buildBookingItems(this.bookingService.booking()?.seats ?? []).reduce((sum, item) => sum + item.price, 0),
  );

  readonly firstNameMessage = computed(() => this.messageFor('firstName', firstNameError(this.form().firstName)));
  readonly lastNameMessage = computed(() => this.messageFor('lastName', lastNameError(this.form().lastName)));
  readonly emailMessage = computed(() => this.messageFor('email', emailError(this.form().email)));
  readonly confirmEmailMessage = computed(() =>
    this.messageFor('confirmEmail', confirmEmailError(this.form().confirmEmail, this.form().email)),
  );
  readonly phoneMessage = computed(() => this.messageFor('phone', phoneError(this.form().phone)));
  readonly termsMessage = computed(() => this.messageFor('termsAccepted', termsError(this.form().termsAccepted)));

  private messageFor(field: FieldKey, error: string | null): string | null {
    if (!error) return null;
    return this.touched()[field] || this.submitted() ? error : null;
  }

  private isValid(): boolean {
    const f = this.form();
    return (
      !firstNameError(f.firstName) &&
      !lastNameError(f.lastName) &&
      !emailError(f.email) &&
      !confirmEmailError(f.confirmEmail, f.email) &&
      !phoneError(f.phone) &&
      !termsError(f.termsAccepted)
    );
  }

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.api.getMovieAndScreening(Number(id)).pipe(
            catchError(() => {
              this.router.navigateByUrl('/');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((data) => this.dataSignal.set(data));
  }

  onInput(field: 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone', value: string): void {
    this.bookingService.updateForm({ [field]: value });
  }

  onBlur(field: FieldKey): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  onTermsChange(checked: boolean): void {
    this.bookingService.updateForm({ termsAccepted: checked });
    this.touched.update((t) => ({ ...t, termsAccepted: true }));
  }

  back(): void {
    this.router.navigate(['/screenings', this.id(), 'summary']);
  }

  pay(): void {
    if (!this.isValid()) {
      this.touched.set({
        firstName: true,
        lastName: true,
        email: true,
        confirmEmail: true,
        phone: true,
        termsAccepted: true,
      });
      this.submitted.set(true);
      this.toast.show('The form contains errors');
      return;
    }

    const booking = this.bookingService.booking();
    const screeningId = this.data()?.screening.id;
    if (!booking || screeningId === undefined) return;

    this.processing.set(true);
    const seats = sortSeatIds(booking.seats);
    const f = this.form();

    this.api
      .createReservation({
        screeningId,
        seats,
        customer: { firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone },
        totalPrice: this.total(),
      })
      .subscribe({
        next: () => {
          this.processing.set(false);
          this.bookingService.markPaid(f.email);
          this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

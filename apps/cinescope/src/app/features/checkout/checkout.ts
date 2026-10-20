import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { formatPrice, orderedSeatIds, totalPrice } from '../../core/seat-utils';
import { ToastService } from '../../core/toast.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

function emailFormatValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return EMAIL_PATTERN.test(control.value) ? null : { format: true };
}

function phoneFormatValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return PHONE_PATTERN.test(control.value) ? null : { format: true };
}

function confirmEmailMatchValidator(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const email = parent.get('email')?.value ?? '';
  return control.value === email ? null : { mismatch: true };
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));
  readonly submitting = signal(false);

  private readonly seats = this.bookingService.booking()?.seats ?? [];
  readonly total = totalPrice(this.seats);
  readonly totalText = formatPrice(this.total);

  readonly payLabel = computed(() => (this.submitting() ? 'Processing…' : `Pay ${this.totalText}`));

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, emailFormatValidator]],
    confirmEmail: ['', [Validators.required, confirmEmailMatchValidator]],
    phone: ['', [phoneFormatValidator]],
    termsAccepted: [false, [Validators.requiredTrue]],
  });

  constructor() {
    const saved = this.bookingService.booking()?.form;
    if (saved) {
      this.form.patchValue(saved, { emitEvent: false });
    }

    this.form.valueChanges.subscribe((value) => {
      this.bookingService.updateForm(value);
    });

    this.form.controls.email.valueChanges.subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });
    });
  }

  fieldError(name: 'firstName' | 'lastName' | 'email' | 'phone', label: string, ruleMessage: string): string | null {
    const control = this.form.controls[name];
    if (!control.touched) return null;
    if (control.hasError('required')) return `${label} is required`;
    if (control.invalid) return ruleMessage;
    return null;
  }

  get confirmEmailError(): string | null {
    const control = this.form.controls.confirmEmail;
    if (!control.touched) return null;
    if (control.hasError('required')) return 'Confirm email is required';
    if (control.invalid) return 'Email addresses do not match';
    return null;
  }

  get termsError(): string | null {
    const control = this.form.controls.termsAccepted;
    if (!control.touched) return null;
    return control.invalid ? 'You must accept the terms and conditions' : null;
  }

  markTermsTouched(): void {
    this.form.controls.termsAccepted.markAsTouched();
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  pay(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }

    const booking = this.bookingService.booking();
    if (!booking) return;

    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: this.screeningId,
        seats: orderedSeatIds(booking.seats),
        customer: {
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          phone: value.phone || '',
        },
        totalPrice: totalPrice(booking.seats),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.bookingService.markPaid(value.email);
          this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

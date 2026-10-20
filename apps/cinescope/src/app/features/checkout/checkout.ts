import { Component, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { CheckoutFormValues } from '../../core/models';
import { formatPrice, orderedSeatIds, totalPrice } from '../../core/seat-utils';
import { ToastService } from '../../core/toast.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{9}$/;

function nameValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (value.length === 0) return { required: true };
  if (value.length < 2) return { tooShort: true };
  return null;
}

function emailValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (value.length === 0) return { required: true };
  if (!EMAIL_RE.test(value)) return { invalid: true };
  return null;
}

function confirmEmailValidator(getEmail: () => string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    if (value.length === 0) return { required: true };
    if (value !== getEmail()) return { mismatch: true };
    return null;
  };
}

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (value.length === 0) return null;
  if (!PHONE_RE.test(value)) return { invalid: true };
  return null;
}

const MESSAGES: Record<keyof CheckoutFormValues, Record<string, string>> = {
  firstName: { required: 'First name is required', tooShort: 'First name must be at least 2 characters' },
  lastName: { required: 'Last name is required', tooShort: 'Last name must be at least 2 characters' },
  email: { required: 'Email is required', invalid: 'Enter a valid email address' },
  confirmEmail: { required: 'Confirm email is required', mismatch: 'Email addresses do not match' },
  phone: { invalid: 'Phone number must be exactly 9 digits' },
  termsAccepted: { required: 'You must accept the terms and conditions' },
};

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', nameValidator],
    lastName: ['', nameValidator],
    email: ['', emailValidator],
    confirmEmail: [''],
    phone: ['', phoneValidator],
    termsAccepted: [false, Validators.requiredTrue],
  });

  protected readonly total = computed(() => totalPrice(this.bookingService.booking()?.seats ?? []));
  protected readonly payLabel = computed(() => `Pay ${formatPrice(this.total())}`);

  constructor() {
    this.form.controls.confirmEmail.addValidators(confirmEmailValidator(() => this.form.controls.email.value));
    this.form.controls.confirmEmail.updateValueAndValidity({ onlySelf: true, emitEvent: false });

    const savedForm = this.bookingService.booking()?.form;
    if (savedForm) {
      this.form.patchValue(savedForm, { emitEvent: false });
    }

    this.form.controls.email.valueChanges.subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    this.form.valueChanges.subscribe((value) => this.bookingService.updateForm(value as CheckoutFormValues));
  }

  protected fieldError(name: keyof CheckoutFormValues): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    const key = Object.keys(control.errors)[0];
    return MESSAGES[name][key] ?? null;
  }

  protected markTermsTouched(): void {
    this.form.controls.termsAccepted.markAsTouched();
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id(), 'summary']);
  }

  protected pay(): void {
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
        screeningId: booking.screeningId,
        seats: orderedSeatIds(booking.seats),
        customer: {
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          phone: value.phone,
        },
        totalPrice: this.total(),
      })
      .subscribe({
        next: () => {
          this.bookingService.markPaid(value.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

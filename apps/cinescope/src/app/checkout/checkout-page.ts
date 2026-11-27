import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Api } from '../api';
import { BookingStore, CheckoutValues } from '../booking';
import { itemIds, formatPrice } from '../seats/seat-layout';
import { ToastService } from '../toast';

type Field = keyof CheckoutValues;

const LABELS: Record<Exclude<Field, 'phone' | 'terms'>, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  confirmEmail: 'Confirm email',
};

const MESSAGES: Record<string, string> = {
  firstName: 'First name must be at least 2 characters',
  lastName: 'Last name must be at least 2 characters',
  email: 'Enter a valid email address',
  confirmEmail: 'Email addresses do not match',
  phone: 'Phone number must be exactly 9 digits',
  terms: 'You must accept the terms and conditions',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validEmail = (control: AbstractControl): ValidationErrors | null =>
  !control.value || EMAIL_PATTERN.test(control.value) ? null : { invalid: true };

const matchesEmail = (control: AbstractControl): ValidationErrors | null => {
  const email = control.parent?.get('email')?.value;
  return !control.value || control.value === email ? null : { invalid: true };
};

const phoneDigits = (control: AbstractControl): ValidationErrors | null =>
  !control.value || /^[0-9]{9}$/.test(control.value) ? null : { invalid: true };

@Component({
  selector: 'app-checkout-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingStore);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  readonly processing = signal(false);
  readonly total = computed(() => `${formatPrice(this.booking.total())}`);
  private readonly formVersion = signal(0);

  readonly form = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validEmail],
    }),
    confirmEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, matchesEmail],
    }),
    phone: new FormControl('', { nonNullable: true, validators: [phoneDigits] }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  constructor() {
    this.form.setValue(this.booking.form(), { emitEvent: false });
    this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });

    const events = this.form.events.subscribe(() => this.formVersion.update((v) => v + 1));
    const values = this.form.valueChanges.subscribe(() =>
      this.booking.setForm(this.form.getRawValue()),
    );
    const email = this.form.controls.email.valueChanges.subscribe(() =>
      this.form.controls.confirmEmail.updateValueAndValidity(),
    );
    inject(DestroyRef).onDestroy(() => {
      events.unsubscribe();
      values.unsubscribe();
      email.unsubscribe();
    });
  }

  error(field: Field): string | null {
    this.formVersion();
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return null;
    if (control.errors['required'] && field in LABELS) {
      return `${LABELS[field as keyof typeof LABELS]} is required`;
    }
    return MESSAGES[field];
  }

  back(): void {
    this.router.navigate(['/screenings', this.id(), 'summary']);
  }

  pay(): void {
    if (this.processing()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formVersion.update((v) => v + 1);
      this.toast.show('The form contains errors');
      return;
    }
    const { firstName, lastName, email, phone } = this.form.getRawValue();
    this.processing.set(true);
    this.api
      .createReservation({
        screeningId: Number(this.id()),
        seats: this.booking.items().flatMap(itemIds),
        customer: { firstName, lastName, email, phone },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { reservationSeats } from '../core/seat-utils';
import { ToastService } from '../core/toast.service';

type FieldName = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailValidator = (c: AbstractControl): ValidationErrors | null =>
  c.value === '' || EMAIL_PATTERN.test(c.value) ? null : { email: true };

const phoneValidator = (c: AbstractControl): ValidationErrors | null =>
  c.value === '' || /^\d{9}$/.test(c.value) ? null : { phone: true };

const matchEmailValidator = (c: AbstractControl): ValidationErrors | null => {
  const email = c.parent?.get('email')?.value;
  return c.value === '' || email === undefined || c.value === email ? null : { mismatch: true };
};

const LABELS: Record<FieldName, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  confirmEmail: 'Confirm email',
  phone: 'Phone number',
  terms: 'Terms',
};

const RULE_MESSAGES: Record<FieldName, string> = {
  firstName: 'First name must be at least 2 characters',
  lastName: 'Last name must be at least 2 characters',
  email: 'Enter a valid email address',
  confirmEmail: 'Email addresses do not match',
  phone: 'Phone number must be exactly 9 digits',
  terms: 'You must accept the terms and conditions',
};

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly processing = signal(false);
  protected readonly total = computed(() => this.booking.total().toFixed(2));
  private readonly version = signal(0);

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, emailValidator] }),
    confirmEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, matchEmailValidator] }),
    phone: new FormControl('', { nonNullable: true, validators: [phoneValidator] }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  constructor() {
    const saved = this.booking.booking()?.form;
    if (saved) this.form.setValue(saved, { emitEvent: false });
    this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });

    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmEmail.updateValueAndValidity());
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.booking.setForm(this.form.getRawValue()));
    this.form.events.pipe(takeUntilDestroyed()).subscribe(() => this.version.update((v) => v + 1));
  }

  protected message(name: FieldName): string | null {
    this.version();
    const control = this.form.controls[name];
    if (!control.touched || control.valid) return null;
    if (control.errors?.['required'] && name !== 'terms') return `${LABELS[name]} is required`;
    return RULE_MESSAGES[name];
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay(): void {
    this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const value = this.form.getRawValue();
    this.processing.set(true);
    this.api
      .reserve({
        screeningId: this.screeningId,
        seats: reservationSeats(this.booking.items()),
        customer: {
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          phone: value.phone,
        },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(value.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

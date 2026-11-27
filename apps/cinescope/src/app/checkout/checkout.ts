import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { formatPrice } from '../core/seats';
import { ToastService } from '../core/toast.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

function fail(message: string): ValidationErrors {
  return { message };
}

function nameValidator(label: string): ValidatorFn {
  return (control) => {
    const value = control.value as string;
    if (value === '') return fail(`${label} is required`);
    return value.length < 2 ? fail(`${label} must be at least 2 characters`) : null;
  };
}

const emailValidator: ValidatorFn = (control) => {
  const value = control.value as string;
  if (value === '') return fail('Email is required');
  return EMAIL_PATTERN.test(value) ? null : fail('Enter a valid email address');
};

const phoneValidator: ValidatorFn = (control) => {
  const value = control.value as string;
  return value === '' || PHONE_PATTERN.test(value)
    ? null
    : fail('Phone number must be exactly 9 digits');
};

const termsValidator: ValidatorFn = (control) =>
  control.value === true ? null : fail('You must accept the terms and conditions');

function confirmEmailValidator(email: () => AbstractControl | undefined): ValidatorFn {
  return (control) => {
    const value = control.value as string;
    if (value === '') return fail('Confirm email is required');
    return value === email()?.value ? null : fail('Email addresses do not match');
  };
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButton, MatCheckbox, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly processing = signal(false);
  protected readonly payLabel = () => `Pay ${formatPrice(this.booking.total())}`;

  protected readonly form: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    confirmEmail: FormControl<string>;
    phone: FormControl<string>;
    terms: FormControl<boolean>;
  }>;

  constructor() {
    const saved = this.booking.booking().form;
    const control = <T>(value: T, validator: ValidatorFn) =>
      new FormControl<T>(value, { nonNullable: true, validators: [validator] });
    const email = control(saved.email, emailValidator);
    this.form = new FormGroup({
      firstName: control(saved.firstName, nameValidator('First name')),
      lastName: control(saved.lastName, nameValidator('Last name')),
      email,
      confirmEmail: control(
        saved.confirmEmail,
        confirmEmailValidator(() => email),
      ),
      phone: control(saved.phone, phoneValidator),
      terms: control(saved.terms, termsValidator),
    });

    email.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.booking.setForm(this.form.getRawValue());
    });
  }

  protected error(name: keyof Checkout['form']['controls']): string | null {
    const control = this.form.controls[name];
    return control.invalid && control.touched ? (control.errors?.['message'] as string) : null;
  }

  protected termsToggled(): void {
    this.form.controls.terms.markAsTouched();
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'summary']);
  }

  protected pay(): void {
    if (this.processing()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const values = this.form.getRawValue();
    const booking = this.booking.booking();
    this.processing.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId as number,
        seats: this.booking.items().flatMap((item) => item.ids),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.booking.total(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.booking.markPaid(values.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

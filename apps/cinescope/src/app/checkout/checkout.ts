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
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../api.service';
import { BookingService, emptyForm } from '../booking.service';
import { ToastService } from '../toast.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

const fail = (msg: string): ValidationErrors => ({ msg });

function name(label: string): ValidatorFn {
  return (control) => {
    const value: string = control.value;
    if (!value) return fail(`${label} is required`);
    return value.length < 2 ? fail(`${label} must be at least 2 characters`) : null;
  };
}

const emailValidator: ValidatorFn = (control) => {
  const value: string = control.value;
  if (!value) return fail('Email is required');
  return EMAIL_PATTERN.test(value) ? null : fail('Enter a valid email address');
};

function confirmEmailValidator(email: () => string): ValidatorFn {
  return (control) => {
    const value: string = control.value;
    if (!value) return fail('Confirm email is required');
    return value === email() ? null : fail('Email addresses do not match');
  };
}

const phoneValidator: ValidatorFn = (control) => {
  const value: string = control.value;
  return !value || PHONE_PATTERN.test(value) ? null : fail('Phone number must be exactly 9 digits');
};

const termsValidator: ValidatorFn = (control) =>
  control.value ? null : fail('You must accept the terms and conditions');

@Component({
  selector: 'app-checkout',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="page">
      <h1 data-testid="checkout-title">Your details</h1>
      <form class="form" [formGroup]="form" novalidate>
        <mat-form-field>
          <mat-label data-testid="first-name-label">First name *</mat-label>
          <input matInput formControlName="firstName" data-testid="first-name-input" />
          @if (error('firstName'); as msg) {
            <mat-error data-testid="first-name-error">{{ msg }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label data-testid="last-name-label">Last name *</mat-label>
          <input matInput formControlName="lastName" data-testid="last-name-input" />
          @if (error('lastName'); as msg) {
            <mat-error data-testid="last-name-error">{{ msg }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label data-testid="email-label">Email *</mat-label>
          <input matInput formControlName="email" data-testid="email-input" />
          @if (error('email'); as msg) {
            <mat-error data-testid="email-error">{{ msg }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label data-testid="confirm-email-label">Confirm email *</mat-label>
          <input matInput formControlName="confirmEmail" data-testid="confirm-email-input" />
          @if (error('confirmEmail'); as msg) {
            <mat-error data-testid="confirm-email-error">{{ msg }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label data-testid="phone-label">Phone number</mat-label>
          <input matInput formControlName="phone" data-testid="phone-input" />
          @if (error('phone'); as msg) {
            <mat-error data-testid="phone-error">{{ msg }}</mat-error>
          }
        </mat-form-field>

        <div>
          <mat-checkbox
            formControlName="terms"
            data-testid="terms-checkbox"
            (change)="form.controls.terms.markAsTouched()"
          >
            <span data-testid="terms-label">I accept the terms and conditions *</span>
          </mat-checkbox>
          @if (error('terms'); as msg) {
            <mat-error class="terms-error" data-testid="terms-error">{{ msg }}</mat-error>
          }
        </div>
      </form>

      <div class="button-row">
        <button
          mat-stroked-button
          type="button"
          data-testid="checkout-back-button"
          (click)="back()"
        >Back</button>
        <button
          mat-flat-button
          type="button"
          data-testid="pay-button"
          [disabled]="processing()"
          (click)="pay()"
        >{{ processing() ? 'Processing…' : 'Pay ' + total() + ' PLN' }}</button>
      </div>
    </div>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      max-width: 480px;
    }
    .terms-error {
      display: block;
      font-size: 12px;
      padding: 0 16px;
    }
  `,
})
export class Checkout {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly screeningId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly processing = signal(false);

  private readonly initial = this.bookingService.booking()?.form ?? emptyForm();
  protected readonly form = new FormGroup({
    firstName: new FormControl(this.initial.firstName, {
      nonNullable: true,
      validators: name('First name'),
    }),
    lastName: new FormControl(this.initial.lastName, {
      nonNullable: true,
      validators: name('Last name'),
    }),
    email: new FormControl(this.initial.email, { nonNullable: true, validators: emailValidator }),
    confirmEmail: new FormControl(this.initial.confirmEmail, {
      nonNullable: true,
      validators: confirmEmailValidator((): string => this.form.controls.email.value),
    }),
    phone: new FormControl(this.initial.phone, { nonNullable: true, validators: phoneValidator }),
    terms: new FormControl(this.initial.terms, { nonNullable: true, validators: termsValidator }),
  });

  constructor() {
    this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false }),
      );
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (!this.processing()) this.bookingService.setForm(this.form.getRawValue());
    });
  }

  protected total(): string {
    return this.bookingService.total().toFixed(2);
  }

  protected error(field: keyof typeof this.form.controls): string | null {
    const control: AbstractControl = this.form.controls[field];
    return control.touched ? (control.errors?.['msg'] ?? null) : null;
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay(): void {
    if (this.processing()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const value = this.form.getRawValue();
    const screeningId = this.bookingService.booking()?.screeningId;
    if (screeningId === undefined) return;
    this.processing.set(true);
    this.api
      .createReservation({
        screeningId,
        seats: this.bookingService.items().flatMap((item) => item.ids),
        customer: {
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          phone: value.phone,
        },
        totalPrice: this.bookingService.total(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.bookingService.markPaid(value.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

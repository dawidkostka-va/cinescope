import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { BookingService, emptyForm } from '../booking.service';
import { FormValues } from '../models';
import { formatPrice } from '../seats';
import { ToastService } from '../toast.service';

type Field = keyof FormValues;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const err = (message: string): ValidationErrors => ({ message });

const minLength = (label: string) => (c: AbstractControl): ValidationErrors | null => {
  const v = c.value as string;
  if (v === '') return err(`${label} is required`);
  return v.length < 2 ? err(`${label} must be at least 2 characters`) : null;
};

const emailRule = (c: AbstractControl): ValidationErrors | null => {
  const v = c.value as string;
  if (v === '') return err('Email is required');
  return EMAIL.test(v) ? null : err('Enter a valid email address');
};

const confirmRule = (c: AbstractControl): ValidationErrors | null => {
  const v = c.value as string;
  if (v === '') return err('Confirm email is required');
  return v === c.parent?.get('email')?.value ? null : err('Email addresses do not match');
};

const phoneRule = (c: AbstractControl): ValidationErrors | null => {
  const v = c.value as string;
  return v === '' || /^\d{9}$/.test(v) ? null : err('Phone number must be exactly 9 digits');
};

const termsRule = (c: AbstractControl): ValidationErrors | null =>
  c.value ? null : err('You must accept the terms and conditions');

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <h1 data-testid="checkout-title">Your details</h1>
      <form class="form" [formGroup]="form" novalidate (ngSubmit)="pay()">
        <mat-form-field>
          <mat-label data-testid="first-name-label">First name *</mat-label>
          <input matInput data-testid="first-name-input" formControlName="firstName" />
          @if (message('firstName'); as m) {
            <mat-error data-testid="first-name-error">{{ m }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label data-testid="last-name-label">Last name *</mat-label>
          <input matInput data-testid="last-name-input" formControlName="lastName" />
          @if (message('lastName'); as m) {
            <mat-error data-testid="last-name-error">{{ m }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label data-testid="email-label">Email *</mat-label>
          <input matInput data-testid="email-input" formControlName="email" />
          @if (message('email'); as m) {
            <mat-error data-testid="email-error">{{ m }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label data-testid="confirm-email-label">Confirm email *</mat-label>
          <input matInput data-testid="confirm-email-input" formControlName="confirmEmail" />
          @if (message('confirmEmail'); as m) {
            <mat-error data-testid="confirm-email-error">{{ m }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label data-testid="phone-label">Phone number</mat-label>
          <input matInput data-testid="phone-input" formControlName="phone" />
          @if (message('phone'); as m) {
            <mat-error data-testid="phone-error">{{ m }}</mat-error>
          }
        </mat-form-field>
        <div class="terms">
          <mat-checkbox data-testid="terms-checkbox" formControlName="terms" (change)="form.controls.terms.markAsTouched()">
            <span data-testid="terms-label">I accept the terms and conditions *</span>
          </mat-checkbox>
          @if (message('terms'); as m) {
            <div class="terms-error" data-testid="terms-error">{{ m }}</div>
          }
        </div>
        <div class="actions">
          <button mat-stroked-button type="button" data-testid="checkout-back-button" (click)="back()">Back</button>
          <button mat-flat-button type="submit" data-testid="pay-button" [disabled]="submitting()">
            {{ submitting() ? 'Processing…' : 'Pay ' + totalText() }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .page {
      max-width: 480px;
      margin: 0 auto;
      padding: 24px;
    }
    .form {
      display: flex;
      flex-direction: column;
    }
    .terms {
      margin-bottom: 16px;
    }
    .terms-error {
      color: var(--mat-sys-error, #b3261e);
      font-size: 12px;
      padding-left: 16px;
    }
    .actions {
      display: flex;
      gap: 12px;
    }
  `,
})
export class Checkout {
  private readonly booking = inject(BookingService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly screeningId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly submitting = signal(false);
  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: minLength('First name') }),
    lastName: new FormControl('', { nonNullable: true, validators: minLength('Last name') }),
    email: new FormControl('', { nonNullable: true, validators: emailRule }),
    confirmEmail: new FormControl('', { nonNullable: true, validators: confirmRule }),
    phone: new FormControl('', { nonNullable: true, validators: phoneRule }),
    terms: new FormControl(false, { nonNullable: true, validators: termsRule }),
  });

  constructor() {
    this.form.setValue({ ...emptyForm(), ...(this.booking.state()?.form ?? {}) });
    const destroyed = inject(DestroyRef);
    this.form.valueChanges.pipe(takeUntilDestroyed(destroyed)).subscribe(() => {
      this.booking.setForm(this.form.getRawValue());
    });
    this.form.controls.email.valueChanges.pipe(takeUntilDestroyed(destroyed)).subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity();
    });
  }

  protected totalText(): string {
    return formatPrice(this.booking.total());
  }

  protected message(field: Field): string | null {
    const control = this.form.controls[field];
    return control.touched ? (control.errors?.['message'] ?? null) : null;
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay(): void {
    if (this.submitting()) return;
    this.form.controls.confirmEmail.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const state = this.booking.state();
    if (!state) return;
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: state.screeningId,
        seats: this.booking.items().flatMap((item) => item.ids),
        customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(v.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

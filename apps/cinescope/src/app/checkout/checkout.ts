import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { BookingService, emptyForm } from '../booking.service';
import { CheckoutValues } from '../models';
import { formatPrice } from '../seating';
import { ToastService } from '../toast.service';

type FieldName = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function minLength(label: string, min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (value === '') return { message: `${label} is required` };
    return value.length < min ? { message: `${label} must be at least ${min} characters` } : null;
  };
}

function emailRule(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (value === '') return { message: 'Email is required' };
  return EMAIL_PATTERN.test(value) ? null : { message: 'Enter a valid email address' };
}

function confirmEmailRule(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (value === '') return { message: 'Confirm email is required' };
  const email = control.parent?.get('email')?.value ?? '';
  return value === email ? null : { message: 'Email addresses do not match' };
}

function phoneRule(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  return value === '' || /^[0-9]{9}$/.test(value) ? null : { message: 'Phone number must be exactly 9 digits' };
}

function termsRule(control: AbstractControl): ValidationErrors | null {
  return control.value === true ? null : { message: 'You must accept the terms and conditions' };
}

@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <h1 data-testid="checkout-title">Your details</h1>
      <form [formGroup]="form" novalidate (ngSubmit)="pay()">
        <div class="field">
          <mat-form-field hideRequiredMarker subscriptSizing="dynamic">
            <mat-label data-testid="first-name-label">First name *</mat-label>
            <input matInput data-testid="first-name-input" formControlName="firstName" autocomplete="off" />
          </mat-form-field>
          @if (error('firstName'); as msg) {
            <div class="error" data-testid="first-name-error">{{ msg }}</div>
          }
        </div>

        <div class="field">
          <mat-form-field hideRequiredMarker subscriptSizing="dynamic">
            <mat-label data-testid="last-name-label">Last name *</mat-label>
            <input matInput data-testid="last-name-input" formControlName="lastName" autocomplete="off" />
          </mat-form-field>
          @if (error('lastName'); as msg) {
            <div class="error" data-testid="last-name-error">{{ msg }}</div>
          }
        </div>

        <div class="field">
          <mat-form-field hideRequiredMarker subscriptSizing="dynamic">
            <mat-label data-testid="email-label">Email *</mat-label>
            <input matInput data-testid="email-input" formControlName="email" autocomplete="off" />
          </mat-form-field>
          @if (error('email'); as msg) {
            <div class="error" data-testid="email-error">{{ msg }}</div>
          }
        </div>

        <div class="field">
          <mat-form-field hideRequiredMarker subscriptSizing="dynamic">
            <mat-label data-testid="confirm-email-label">Confirm email *</mat-label>
            <input matInput data-testid="confirm-email-input" formControlName="confirmEmail" autocomplete="off" />
          </mat-form-field>
          @if (error('confirmEmail'); as msg) {
            <div class="error" data-testid="confirm-email-error">{{ msg }}</div>
          }
        </div>

        <div class="field">
          <mat-form-field hideRequiredMarker subscriptSizing="dynamic">
            <mat-label data-testid="phone-label">Phone number</mat-label>
            <input matInput data-testid="phone-input" formControlName="phone" autocomplete="off" />
          </mat-form-field>
          @if (error('phone'); as msg) {
            <div class="error" data-testid="phone-error">{{ msg }}</div>
          }
        </div>

        <div class="field">
          <mat-checkbox data-testid="terms-checkbox" formControlName="terms" (change)="touch('terms')">
            <span data-testid="terms-label">I accept the terms and conditions *</span>
          </mat-checkbox>
          @if (error('terms'); as msg) {
            <div class="error" data-testid="terms-error">{{ msg }}</div>
          }
        </div>

        <div class="actions">
          <button mat-stroked-button type="button" data-testid="checkout-back-button" (click)="back()">Back</button>
          <button
            mat-flat-button
            type="button"
            data-testid="pay-button"
            [disabled]="paying()"
            (click)="pay()"
          >
            {{ paying() ? 'Processing…' : 'Pay ' + totalText() }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .page {
      max-width: 520px;
      margin: 0 auto;
      padding: 24px;
    }
    .field {
      margin-bottom: 12px;
    }
    mat-form-field {
      width: 100%;
    }
    .error {
      color: #b3261e;
      font-size: 12px;
      padding: 4px 16px 0;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
  `,
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly paying = signal(false);

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [minLength('First name', 2)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [minLength('Last name', 2)] }),
    email: new FormControl('', { nonNullable: true, validators: [emailRule] }),
    confirmEmail: new FormControl('', { nonNullable: true, validators: [confirmEmailRule] }),
    phone: new FormControl('', { nonNullable: true, validators: [phoneRule] }),
    terms: new FormControl(false, { nonNullable: true, validators: [termsRule] }),
  });

  constructor() {
    const saved: CheckoutValues = this.booking.booking()?.form ?? emptyForm();
    this.form.setValue({ ...emptyForm(), ...saved });
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.form.controls.confirmEmail.updateValueAndValidity());
    this.form.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.booking.setForm(this.form.getRawValue()));
  }

  totalText(): string {
    return formatPrice(this.booking.total());
  }

  error(name: FieldName): string | null {
    const control = this.form.controls[name];
    return control.touched ? ((control.errors?.['message'] as string | undefined) ?? null) : null;
  }

  touch(name: FieldName): void {
    this.form.controls[name].markAsTouched();
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  pay(): void {
    if (this.paying()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const value = this.form.getRawValue();
    this.paying.set(true);
    this.api
      .createReservation({
        screeningId: this.screeningId,
        seats: this.booking.tickets().flatMap((t) => t.ids),
        customer: { firstName: value.firstName, lastName: value.lastName, email: value.email, phone: value.phone },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(value.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

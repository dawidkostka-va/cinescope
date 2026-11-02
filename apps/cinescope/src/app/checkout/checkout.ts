import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { CinescopeApi } from '../api';
import { BookingService, CustomerForm, EMPTY_FORM } from '../booking/booking';
import { formatPrice, unitsOf } from '../booking/units';
import { NewReservation } from '../models';
import { ToastService } from '../toast/toast';

type FieldKey = keyof CustomerForm;
type TextFieldKey = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type Errors = Record<FieldKey, string | null>;

interface TextField {
  key: TextFieldKey;
  prefix: string;
  label: string;
  type: string;
  required: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;
const ALL_FIELDS: FieldKey[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];

function nameError(value: string, label: string): string | null {
  if (value === '') {
    return `${label} is required`;
  }
  return value.length < 2 ? `${label} must be at least 2 characters` : null;
}

function validate(values: CustomerForm): Errors {
  return {
    firstName: nameError(values.firstName, 'First name'),
    lastName: nameError(values.lastName, 'Last name'),
    email:
      values.email === ''
        ? 'Email is required'
        : EMAIL_PATTERN.test(values.email)
          ? null
          : 'Enter a valid email address',
    confirmEmail:
      values.confirmEmail === ''
        ? 'Confirm email is required'
        : values.confirmEmail !== values.email
          ? 'Email addresses do not match'
          : null,
    phone:
      values.phone === '' || PHONE_PATTERN.test(values.phone)
        ? null
        : 'Phone number must be exactly 9 digits',
    terms: values.terms ? null : 'You must accept the terms and conditions',
  };
}

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, MatButton, MatCheckbox, MatFormField, MatInput, MatLabel],
  template: `
    <div class="page">
      <h1 data-testid="checkout-title">Your details</h1>

      @for (field of textFields; track field.key) {
        <div class="field">
          <mat-form-field appearance="outline">
            <mat-label [attr.data-testid]="field.prefix + '-label'"
              >{{ field.label }}{{ field.required ? ' *' : '' }}</mat-label
            >
            <input
              matInput
              [attr.data-testid]="field.prefix + '-input'"
              [type]="field.type"
              [ngModel]="values()[field.key]"
              (ngModelChange)="setText(field.key, $event)"
              (blur)="markTouched(field.key)"
            />
          </mat-form-field>
          @let message = visibleError(field.key);
          @if (message) {
            <div class="error" [attr.data-testid]="field.prefix + '-error'">{{ message }}</div>
          }
        </div>
      }

      <div class="field">
        <mat-checkbox
          data-testid="terms-checkbox"
          [ngModel]="values().terms"
          (ngModelChange)="setTerms($event)"
          (change)="markTouched('terms')"
          ><span data-testid="terms-label">I accept the terms and conditions *</span></mat-checkbox
        >
        @let termsMessage = visibleError('terms');
        @if (termsMessage) {
          <div class="error" data-testid="terms-error">{{ termsMessage }}</div>
        }
      </div>

      <div class="actions">
        <button mat-stroked-button data-testid="checkout-back-button" (click)="back()">Back</button>
        <button
          mat-flat-button
          color="primary"
          data-testid="pay-button"
          [disabled]="submitting()"
          (click)="pay()"
        >
          {{ submitting() ? 'Processing…' : 'Pay ' + totalText() }}
        </button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 24px;
      font-family: Roboto, 'Helvetica Neue', sans-serif;
    }

    .page {
      max-width: 420px;
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 16px;
      font-size: 28px;
    }

    .field {
      display: flex;
      flex-direction: column;
      margin-bottom: 8px;
    }

    mat-form-field {
      width: 100%;
    }

    .error {
      margin: -12px 0 0 4px;
      color: #c62828;
      font-size: 12px;
    }

    .actions {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
    }
  `,
})
export class Checkout {
  private readonly api = inject(CinescopeApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly textFields: TextField[] = [
    { key: 'firstName', prefix: 'first-name', label: 'First name', type: 'text', required: true },
    { key: 'lastName', prefix: 'last-name', label: 'Last name', type: 'text', required: true },
    { key: 'email', prefix: 'email', label: 'Email', type: 'email', required: true },
    {
      key: 'confirmEmail',
      prefix: 'confirm-email',
      label: 'Confirm email',
      type: 'email',
      required: true,
    },
    { key: 'phone', prefix: 'phone', label: 'Phone number', type: 'tel', required: false },
  ];

  protected readonly values = signal<CustomerForm>(this.booking.booking()?.form ?? EMPTY_FORM);
  private readonly touched = signal<Record<FieldKey, boolean>>(
    Object.fromEntries(ALL_FIELDS.map((field) => [field, false])) as Record<FieldKey, boolean>,
  );
  protected readonly submitting = signal(false);

  private readonly errors = computed(() => validate(this.values()));

  private readonly total = computed(() =>
    unitsOf(this.booking.booking()?.seats ?? []).reduce((sum, unit) => sum + unit.price, 0),
  );

  protected readonly totalText = computed(() => formatPrice(this.total()));

  protected visibleError(field: FieldKey): string | null {
    return this.touched()[field] ? this.errors()[field] : null;
  }

  protected setText(key: TextFieldKey, value: string): void {
    this.update({ [key]: value });
  }

  protected setTerms(terms: boolean): void {
    this.update({ terms });
  }

  protected markTouched(field: FieldKey): void {
    this.touched.update((current) => ({ ...current, [field]: true }));
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay(): void {
    this.touched.set(
      Object.fromEntries(ALL_FIELDS.map((field) => [field, true])) as Record<FieldKey, boolean>,
    );
    const values = this.values();
    const booking = this.booking.booking();
    if (!booking) {
      return;
    }
    if (Object.values(this.errors()).some((message) => message !== null)) {
      this.toast.show('The form contains errors');
      return;
    }

    const reservation: NewReservation = {
      screeningId: booking.screeningId,
      seats: unitsOf(booking.seats).flatMap((unit) => unit.ids),
      customer: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      },
      totalPrice: this.total(),
    };

    this.submitting.set(true);
    this.api.createReservation(reservation).subscribe({
      next: () => {
        this.booking.markPaid(values.email);
        void this.router.navigate(['/confirmation']);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.show('Payment failed. Please try again.');
      },
    });
  }

  private update(patch: Partial<CustomerForm>): void {
    const next = { ...this.values(), ...patch };
    this.values.set(next);
    this.booking.setForm(next);
  }
}

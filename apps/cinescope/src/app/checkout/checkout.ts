import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService, CheckoutForm, emptyForm } from '../core/booking.service';
import { formatPrice } from '../core/seat-layout';
import { ToastService } from '../core/toast.service';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type Field = TextField | 'terms';

const TEXT_FIELDS: { name: TextField; testId: string; label: string; required: boolean; type: string }[] = [
  { name: 'firstName', testId: 'first-name', label: 'First name', required: true, type: 'text' },
  { name: 'lastName', testId: 'last-name', label: 'Last name', required: true, type: 'text' },
  { name: 'email', testId: 'email', label: 'Email', required: true, type: 'email' },
  { name: 'confirmEmail', testId: 'confirm-email', label: 'Confirm email', required: true, type: 'email' },
  { name: 'phone', testId: 'phone', label: 'Phone number', required: false, type: 'tel' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{9}$/;

function validate(v: CheckoutForm): Record<Field, string | null> {
  const minLength = (value: string, label: string) =>
    value === ''
      ? `${label} is required`
      : value.length < 2
        ? `${label} must be at least 2 characters`
        : null;
  return {
    firstName: minLength(v.firstName, 'First name'),
    lastName: minLength(v.lastName, 'Last name'),
    email: v.email === '' ? 'Email is required' : EMAIL_PATTERN.test(v.email) ? null : 'Enter a valid email address',
    confirmEmail:
      v.confirmEmail === ''
        ? 'Confirm email is required'
        : v.confirmEmail === v.email
          ? null
          : 'Email addresses do not match',
    phone: v.phone === '' || PHONE_PATTERN.test(v.phone) ? null : 'Phone number must be exactly 9 digits',
    terms: v.terms ? null : 'You must accept the terms and conditions',
  };
}

@Component({
  selector: 'app-checkout',
  imports: [MatButton, MatCheckbox, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <h1 data-testid="checkout-title">Your details</h1>
      <form class="form" novalidate (submit)="$event.preventDefault()">
        @for (field of textFields; track field.name) {
          <div class="field">
            <mat-form-field subscriptSizing="dynamic" [class.mat-form-field-invalid]="!!visibleError(field.name)">
              <mat-label [attr.data-testid]="field.testId + '-label'">
                {{ field.label }}{{ field.required ? ' *' : '' }}
              </mat-label>
              <input
                matInput
                [type]="field.type"
                autocomplete="off"
                [attr.data-testid]="field.testId + '-input'"
                [value]="values()[field.name]"
                (input)="setText(field.name, $any($event.target).value)"
                (blur)="touch(field.name)"
              />
            </mat-form-field>
            @if (visibleError(field.name); as message) {
              <div class="error" [attr.data-testid]="field.testId + '-error'">{{ message }}</div>
            }
          </div>
        }
        <div class="field">
          <mat-checkbox
            data-testid="terms-checkbox"
            [checked]="values().terms"
            (change)="setTerms($event.checked)"
          >
            <span data-testid="terms-label">I accept the terms and conditions *</span>
          </mat-checkbox>
          @if (visibleError('terms'); as message) {
            <div class="error" data-testid="terms-error">{{ message }}</div>
          }
        </div>
      </form>
      <div class="actions">
        <button matButton="outlined" data-testid="checkout-back-button" (click)="back()">Back</button>
        <button matButton="filled" data-testid="pay-button" [disabled]="paying()" (click)="pay()">
          {{ paying() ? 'Processing…' : 'Pay ' + totalText() }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
    }
    .field mat-form-field {
      width: 100%;
    }
    .error {
      color: #c62828;
      font-size: 13px;
      margin: 4px 0 0 4px;
    }
  `,
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  private readonly booking = inject(BookingService);

  protected readonly textFields = TEXT_FIELDS;
  protected readonly values = signal<CheckoutForm>({ ...emptyForm(), ...this.booking.booking()?.form });
  private readonly touched = signal<Partial<Record<Field, boolean>>>({});
  private readonly errors = computed(() => validate(this.values()));
  protected readonly paying = signal(false);
  protected readonly totalText = computed(() => formatPrice(this.booking.total()));

  protected visibleError(field: Field): string | null {
    return this.touched()[field] ? this.errors()[field] : null;
  }

  protected setText(field: TextField, value: string): void {
    this.update({ [field]: value });
  }

  protected setTerms(checked: boolean): void {
    this.update({ terms: checked });
    this.touch('terms');
  }

  protected touch(field: Field): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'summary']);
  }

  protected pay(): void {
    if (this.paying()) return;
    const errors = this.errors();
    if (Object.values(errors).some((e) => e !== null)) {
      this.touched.set({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });
      this.toast.show('The form contains errors');
      return;
    }
    const v = this.values();
    this.paying.set(true);
    this.api
      .createReservation({
        screeningId: this.id,
        seats: this.booking.booking()?.seats ?? [],
        customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(v.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  private update(patch: Partial<CheckoutForm>): void {
    this.values.update((v) => ({ ...v, ...patch }));
    this.booking.setForm(this.values());
  }
}

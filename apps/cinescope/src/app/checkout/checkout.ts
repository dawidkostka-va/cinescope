import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService, CheckoutForm, emptyForm } from '../core/booking.service';
import { formatAmount } from '../core/seats';
import { ToastService } from '../core/toast.service';

type TextKey = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type FieldKey = TextKey | 'terms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{9}$/;

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <h1 data-testid="checkout-title">Your details</h1>
      <div class="form">
        @for (f of fields; track f.id) {
          <div class="field">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label [attr.data-testid]="f.id + '-label'">{{ f.label + (f.required ? ' *' : '') }}</mat-label>
              <input
                matInput
                type="text"
                autocomplete="off"
                [attr.data-testid]="f.id + '-input'"
                [value]="values()[f.key]"
                (input)="onInput(f.key, $any($event.target).value)"
                (blur)="touch(f.key)"
              />
            </mat-form-field>
            @if (message(f.key); as msg) {
              <div class="error" [attr.data-testid]="f.id + '-error'">{{ msg }}</div>
            }
          </div>
        }
        <div class="field">
          <mat-checkbox data-testid="terms-checkbox" [checked]="values().terms" (change)="onTerms($event.checked)">
            <span data-testid="terms-label">I accept the terms and conditions *</span>
          </mat-checkbox>
          @if (message('terms'); as msg) {
            <div class="error" data-testid="terms-error">{{ msg }}</div>
          }
        </div>
      </div>
      <div class="actions">
        <button matButton="outlined" data-testid="checkout-back-button" (click)="back()">Back</button>
        <button matButton="filled" data-testid="pay-button" [disabled]="paying()" (click)="pay()">{{ payLabel() }}</button>
      </div>
    </div>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 480px;
    }
    mat-form-field {
      width: 100%;
    }
    .error {
      color: #b3261e;
      font-size: 0.8rem;
      margin: 4px 0 0 16px;
    }
  `,
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly fields: { key: TextKey; id: string; label: string; required: boolean }[] = [
    { key: 'firstName', id: 'first-name', label: 'First name', required: true },
    { key: 'lastName', id: 'last-name', label: 'Last name', required: true },
    { key: 'email', id: 'email', label: 'Email', required: true },
    { key: 'confirmEmail', id: 'confirm-email', label: 'Confirm email', required: true },
    { key: 'phone', id: 'phone', label: 'Phone number', required: false },
  ];

  readonly values = signal<CheckoutForm>({ ...(this.booking.booking()?.form ?? emptyForm()) });
  private readonly touched = signal<Partial<Record<FieldKey, boolean>>>({});
  readonly paying = signal(false);

  readonly payLabel = computed(() =>
    this.paying() ? 'Processing…' : `Pay ${formatAmount(this.booking.total())} PLN`,
  );

  private readonly errors = computed<Record<FieldKey, string | null>>(() => {
    const v = this.values();
    const minLength = (value: string, label: string) =>
      value === ''
        ? `${label} is required`
        : value.length < 2
          ? `${label} must be at least 2 characters`
          : null;
    return {
      firstName: minLength(v.firstName, 'First name'),
      lastName: minLength(v.lastName, 'Last name'),
      email:
        v.email === '' ? 'Email is required' : EMAIL_PATTERN.test(v.email) ? null : 'Enter a valid email address',
      confirmEmail:
        v.confirmEmail === ''
          ? 'Confirm email is required'
          : v.confirmEmail === v.email
            ? null
            : 'Email addresses do not match',
      phone: v.phone === '' || PHONE_PATTERN.test(v.phone) ? null : 'Phone number must be exactly 9 digits',
      terms: v.terms ? null : 'You must accept the terms and conditions',
    };
  });

  message(key: FieldKey): string | null {
    return this.touched()[key] ? this.errors()[key] : null;
  }

  onInput(key: TextKey, value: string): void {
    this.update({ ...this.values(), [key]: value });
  }

  onTerms(checked: boolean): void {
    this.update({ ...this.values(), terms: checked });
    this.touch('terms');
  }

  touch(key: FieldKey): void {
    this.touched.update((t) => ({ ...t, [key]: true }));
  }

  private update(values: CheckoutForm): void {
    this.values.set(values);
    this.booking.setForm(values);
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  pay(): void {
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
        screeningId: this.screeningId,
        seats: this.booking.tickets().flatMap((t) => t.ids),
        customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        totalPrice: this.booking.total(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
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
}

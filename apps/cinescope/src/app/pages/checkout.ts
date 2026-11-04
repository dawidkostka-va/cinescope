import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../core/api';
import { BookingStore, emptyForm } from '../core/booking';
import { FormValues } from '../core/models';
import { formatPrice } from '../core/seats';
import { ToastService } from '../core/toast';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type Field = TextField | 'terms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(field: Field, v: FormValues): string | null {
  switch (field) {
    case 'firstName':
      return v.firstName === '' ? 'First name is required' : v.firstName.length < 2 ? 'First name must be at least 2 characters' : null;
    case 'lastName':
      return v.lastName === '' ? 'Last name is required' : v.lastName.length < 2 ? 'Last name must be at least 2 characters' : null;
    case 'email':
      return v.email === '' ? 'Email is required' : !EMAIL_PATTERN.test(v.email) ? 'Enter a valid email address' : null;
    case 'confirmEmail':
      return v.confirmEmail === '' ? 'Confirm email is required' : v.confirmEmail !== v.email ? 'Email addresses do not match' : null;
    case 'phone':
      return v.phone !== '' && !/^[0-9]{9}$/.test(v.phone) ? 'Phone number must be exactly 9 digits' : null;
    case 'terms':
      return v.terms ? null : 'You must accept the terms and conditions';
  }
}

const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];

@Component({
  selector: 'app-checkout',
  imports: [MatButton, MatCheckbox, MatFormFieldModule, MatInputModule],
  template: `
    <main class="page">
      <h1 data-testid="checkout-title">Your details</h1>
      <form class="form" novalidate (submit)="$event.preventDefault()">
        <div class="field">
          <label for="firstName" data-testid="first-name-label">First name *</label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <input matInput id="firstName" data-testid="first-name-input" [value]="initial.firstName"
              (input)="onText('firstName', $event)" (blur)="touch('firstName')" />
          </mat-form-field>
          @if (error('firstName'); as message) {
            <div class="error" data-testid="first-name-error">{{ message }}</div>
          }
        </div>

        <div class="field">
          <label for="lastName" data-testid="last-name-label">Last name *</label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <input matInput id="lastName" data-testid="last-name-input" [value]="initial.lastName"
              (input)="onText('lastName', $event)" (blur)="touch('lastName')" />
          </mat-form-field>
          @if (error('lastName'); as message) {
            <div class="error" data-testid="last-name-error">{{ message }}</div>
          }
        </div>

        <div class="field">
          <label for="email" data-testid="email-label">Email *</label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <input matInput id="email" data-testid="email-input" [value]="initial.email"
              (input)="onText('email', $event)" (blur)="touch('email')" />
          </mat-form-field>
          @if (error('email'); as message) {
            <div class="error" data-testid="email-error">{{ message }}</div>
          }
        </div>

        <div class="field">
          <label for="confirmEmail" data-testid="confirm-email-label">Confirm email *</label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <input matInput id="confirmEmail" data-testid="confirm-email-input" [value]="initial.confirmEmail"
              (input)="onText('confirmEmail', $event)" (blur)="touch('confirmEmail')" />
          </mat-form-field>
          @if (error('confirmEmail'); as message) {
            <div class="error" data-testid="confirm-email-error">{{ message }}</div>
          }
        </div>

        <div class="field">
          <label for="phone" data-testid="phone-label">Phone number</label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <input matInput id="phone" data-testid="phone-input" [value]="initial.phone"
              (input)="onText('phone', $event)" (blur)="touch('phone')" />
          </mat-form-field>
          @if (error('phone'); as message) {
            <div class="error" data-testid="phone-error">{{ message }}</div>
          }
        </div>

        <div class="field">
          <mat-checkbox data-testid="terms-checkbox" [checked]="initial.terms" (change)="onTerms($event.checked)">
            <span data-testid="terms-label">I accept the terms and conditions *</span>
          </mat-checkbox>
          @if (error('terms'); as message) {
            <div class="error" data-testid="terms-error">{{ message }}</div>
          }
        </div>

        <div class="actions">
          <button type="button" matButton="outlined" data-testid="checkout-back-button" (click)="back()">Back</button>
          <button type="button" matButton="filled" data-testid="pay-button" [disabled]="paying()" (click)="pay()">
            {{ paying() ? 'Processing…' : 'Pay ' + price(store.total()) }}
          </button>
        </div>
      </form>
    </main>
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
      gap: 12px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field mat-form-field {
      width: 100%;
    }
    .error {
      color: #b3261e;
      font-size: 12px;
    }
    .actions {
      display: flex;
      gap: 16px;
      margin-top: 8px;
    }
  `,
})
export class Checkout {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly store = inject(BookingStore);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly initial: FormValues = { ...emptyForm(), ...this.store.booking()?.form };
  private readonly values = signal<FormValues>(this.initial);
  private readonly touched = signal<ReadonlySet<Field>>(new Set());
  protected readonly paying = signal(false);

  private readonly errors = computed(() => {
    const v = this.values();
    const touched = this.touched();
    return Object.fromEntries(FIELDS.map((f) => [f, touched.has(f) ? validate(f, v) : null])) as Record<Field, string | null>;
  });

  protected price = formatPrice;

  protected error(field: Field): string | null {
    return this.errors()[field];
  }

  protected onText(field: TextField, event: Event): void {
    this.update({ ...this.values(), [field]: (event.target as HTMLInputElement).value });
  }

  protected onTerms(checked: boolean): void {
    this.update({ ...this.values(), terms: checked });
    this.touch('terms');
  }

  protected touch(field: Field): void {
    if (!this.touched().has(field)) {
      this.touched.set(new Set([...this.touched(), field]));
    }
  }

  private update(values: FormValues): void {
    this.values.set(values);
    this.store.setForm(values);
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay(): void {
    if (this.paying()) return;
    const v = this.values();
    if (FIELDS.some((f) => validate(f, v) !== null)) {
      this.touched.set(new Set(FIELDS));
      this.toast.show('The form contains errors');
      return;
    }
    this.paying.set(true);
    this.api
      .reserve({
        screeningId: this.screeningId,
        seats: this.store.items().flatMap((item) => item.ids),
        customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        totalPrice: this.store.total(),
      })
      .subscribe({
        next: () => {
          this.store.markPaid(v.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

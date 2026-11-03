import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { BookingService, CheckoutValues, emptyForm, formatPrice } from '../booking.service';
import { ToastService } from '../toast';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type Field = TextField | 'terms';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\d{9}$/;

function validate(v: CheckoutValues): Record<Field, string | null> {
  return {
    firstName:
      v.firstName === ''
        ? 'First name is required'
        : v.firstName.length < 2
          ? 'First name must be at least 2 characters'
          : null,
    lastName:
      v.lastName === ''
        ? 'Last name is required'
        : v.lastName.length < 2
          ? 'Last name must be at least 2 characters'
          : null,
    email: v.email === '' ? 'Email is required' : !EMAIL.test(v.email) ? 'Enter a valid email address' : null,
    confirmEmail:
      v.confirmEmail === ''
        ? 'Confirm email is required'
        : v.confirmEmail !== v.email
          ? 'Email addresses do not match'
          : null,
    phone: v.phone !== '' && !PHONE.test(v.phone) ? 'Phone number must be exactly 9 digits' : null,
    terms: v.terms ? null : 'You must accept the terms and conditions',
  };
}

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <h1 data-testid="checkout-title">Your details</h1>
      <div class="form">
        <mat-form-field>
          <mat-label data-testid="first-name-label">First name *</mat-label>
          <input matInput data-testid="first-name-input" [value]="values().firstName"
            (input)="set('firstName', $any($event.target).value)" (blur)="touch('firstName')" />
        </mat-form-field>
        @if (error('firstName'); as e) {
          <div class="error" data-testid="first-name-error">{{ e }}</div>
        }

        <mat-form-field>
          <mat-label data-testid="last-name-label">Last name *</mat-label>
          <input matInput data-testid="last-name-input" [value]="values().lastName"
            (input)="set('lastName', $any($event.target).value)" (blur)="touch('lastName')" />
        </mat-form-field>
        @if (error('lastName'); as e) {
          <div class="error" data-testid="last-name-error">{{ e }}</div>
        }

        <mat-form-field>
          <mat-label data-testid="email-label">Email *</mat-label>
          <input matInput data-testid="email-input" [value]="values().email"
            (input)="set('email', $any($event.target).value)" (blur)="touch('email')" />
        </mat-form-field>
        @if (error('email'); as e) {
          <div class="error" data-testid="email-error">{{ e }}</div>
        }

        <mat-form-field>
          <mat-label data-testid="confirm-email-label">Confirm email *</mat-label>
          <input matInput data-testid="confirm-email-input" [value]="values().confirmEmail"
            (input)="set('confirmEmail', $any($event.target).value)" (blur)="touch('confirmEmail')" />
        </mat-form-field>
        @if (error('confirmEmail'); as e) {
          <div class="error" data-testid="confirm-email-error">{{ e }}</div>
        }

        <mat-form-field>
          <mat-label data-testid="phone-label">Phone number</mat-label>
          <input matInput data-testid="phone-input" [value]="values().phone"
            (input)="set('phone', $any($event.target).value)" (blur)="touch('phone')" />
        </mat-form-field>
        @if (error('phone'); as e) {
          <div class="error" data-testid="phone-error">{{ e }}</div>
        }

        <mat-checkbox data-testid="terms-checkbox" [checked]="values().terms" (change)="toggleTerms($event.checked)">
          <span data-testid="terms-label">I accept the terms and conditions *</span>
        </mat-checkbox>
        @if (error('terms'); as e) {
          <div class="error" data-testid="terms-error">{{ e }}</div>
        }
      </div>

      <div class="actions">
        <button mat-stroked-button data-testid="checkout-back-button" (click)="back()">Back</button>
        <button mat-flat-button data-testid="pay-button" [disabled]="paying()" (click)="pay()">
          {{ paying() ? 'Processing…' : 'Pay ' + price(booking.total()) + ' PLN' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .page {
      max-width: 480px;
    }
    h1 {
      text-align: center;
    }
    .form {
      display: flex;
      flex-direction: column;
    }
    mat-form-field {
      width: 100%;
    }
    .error {
      color: #c62828;
      font-size: 13px;
      margin: -14px 0 12px 16px;
    }
    mat-checkbox + .error {
      margin: 0 0 12px 16px;
    }
  `,
})
export class CheckoutPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  protected readonly booking = inject(BookingService);

  protected readonly values = signal<CheckoutValues>(this.booking.booking()?.form ?? emptyForm());
  private readonly touched = signal<ReadonlySet<Field>>(new Set());
  private readonly errors = computed(() => validate(this.values()));
  protected readonly paying = signal(false);
  protected readonly price = formatPrice;

  protected error(field: Field): string | null {
    return this.touched().has(field) ? this.errors()[field] : null;
  }

  protected set(field: TextField, value: string): void {
    this.update({ ...this.values(), [field]: value });
  }

  protected toggleTerms(checked: boolean): void {
    this.update({ ...this.values(), terms: checked });
    this.touch('terms');
  }

  private update(values: CheckoutValues): void {
    this.values.set(values);
    this.booking.updateForm(values);
  }

  protected touch(field: Field): void {
    if (!this.touched().has(field)) this.touched.set(new Set(this.touched()).add(field));
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'summary']);
  }

  protected pay(): void {
    if (this.paying()) return;
    const v = this.values();
    const errors = this.errors();
    if (Object.values(errors).some((e) => e !== null)) {
      this.touched.set(new Set<Field>(['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms']));
      this.toast.show('The form contains errors');
      return;
    }
    this.paying.set(true);
    this.api
      .createReservation({
        screeningId: this.id,
        seats: this.booking.tickets().flatMap((t) => t.ids),
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
}

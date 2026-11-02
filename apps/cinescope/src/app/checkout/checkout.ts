import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { BookingService } from '../booking/booking.service';
import { CheckoutValues } from '../models';
import { formatPln, priceOf } from '../pricing';
import { cellIds, compareCells } from '../seat-map/auditorium';
import { ToastService } from '../toast/toast';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type Field = TextField | 'terms';

const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;
const EMPTY_VALUES: CheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function nameError(value: string, label: string): string | null {
  if (!value) return `${label} is required`;
  return value.length < 2 ? `${label} must be at least 2 characters` : null;
}

function validate(v: CheckoutValues): Record<Field, string | null> {
  return {
    firstName: nameError(v.firstName, 'First name'),
    lastName: nameError(v.lastName, 'Last name'),
    email: !v.email ? 'Email is required' : EMAIL_PATTERN.test(v.email) ? null : 'Enter a valid email address',
    confirmEmail: !v.confirmEmail
      ? 'Confirm email is required'
      : v.confirmEmail !== v.email
        ? 'Email addresses do not match'
        : null,
    phone: v.phone === '' || PHONE_PATTERN.test(v.phone) ? null : 'Phone number must be exactly 9 digits',
    terms: v.terms ? null : 'You must accept the terms and conditions',
  };
}

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly values = signal<CheckoutValues>(this.booking.booking()?.form ?? EMPTY_VALUES);
  private readonly touched = signal<ReadonlySet<Field>>(new Set());
  private readonly errors = computed(() => validate(this.values()));
  readonly total = computed(() => this.booking.cells().reduce((sum, cell) => sum + priceOf(cell), 0));
  readonly submitting = signal(false);

  protected readonly formatPln = formatPln;

  protected shown(field: Field): string | null {
    return this.touched().has(field) ? this.errors()[field] : null;
  }

  protected setText(field: TextField, event: Event): void {
    this.update({ [field]: (event.target as HTMLInputElement).value });
  }

  protected toggleTerms(change: MatCheckboxChange): void {
    this.update({ terms: change.checked });
    this.touch('terms');
  }

  protected touch(field: Field): void {
    this.touched.update((current) => new Set([...current, field]));
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.booking.booking()?.screeningId, 'summary']);
  }

  protected pay(): void {
    this.touched.set(new Set(FIELDS));
    const errors = this.errors();
    if (FIELDS.some((field) => errors[field])) {
      this.toast.show('The form contains errors');
      return;
    }
    const current = this.booking.booking();
    if (!current) return;

    const values = this.values();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: current.screeningId,
        seats: [...current.cells].sort(compareCells).flatMap(cellIds),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.total(),
      })
      .subscribe({
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

  private update(patch: Partial<CheckoutValues>): void {
    const next = { ...this.values(), ...patch };
    this.values.set(next);
    this.booking.setForm(next);
  }
}

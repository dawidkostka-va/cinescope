import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { formatPrice, priceOf, seatIds, Selection, sortSelections } from '../auditorium';
import { BookingService, CustomerForm, EMPTY_FORM } from '../booking.service';
import { ToastService } from '../toast.service';

type Field = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';
type TextField = Exclude<Field, 'terms'>;
type Errors = Partial<Record<Field, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;
const ALL_TOUCHED: Record<Field, boolean> = {
  firstName: true,
  lastName: true,
  email: true,
  confirmEmail: true,
  phone: true,
  terms: true,
};

function validateName(value: string, label: string): string | undefined {
  if (value === '') {
    return `${label} is required`;
  }
  return value.length < 2 ? `${label} must be at least 2 characters` : undefined;
}

function validateForm(form: CustomerForm): Errors {
  const errors: Errors = {
    firstName: validateName(form.firstName, 'First name'),
    lastName: validateName(form.lastName, 'Last name'),
  };
  if (form.email === '') {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (form.confirmEmail === '') {
    errors.confirmEmail = 'Confirm email is required';
  } else if (form.confirmEmail !== form.email) {
    errors.confirmEmail = 'Email addresses do not match';
  }
  if (form.phone !== '' && !PHONE_PATTERN.test(form.phone)) {
    errors.phone = 'Phone number must be exactly 9 digits';
  }
  if (!form.terms) {
    errors.terms = 'You must accept the terms and conditions';
  }
  return errors;
}

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly booking = inject(BookingService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly screeningId = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly form = computed(() => this.booking.current()?.form ?? EMPTY_FORM);
  protected readonly errors = computed(() => validateForm(this.form()));
  protected readonly total = computed(() =>
    (this.booking.current()?.selections ?? []).reduce((sum, s) => sum + priceOf(s), 0),
  );
  protected readonly payLabel = computed(() => `Pay ${formatPrice(this.total())}`);
  protected readonly submitting = signal(false);
  private readonly touched = signal<Record<Field, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    terms: false,
  });

  protected shownError(field: Field): string | undefined {
    return this.touched()[field] ? this.errors()[field] : undefined;
  }

  protected touch(field: Field): void {
    this.touched.update((state) => ({ ...state, [field]: true }));
  }

  protected setText(field: TextField, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.booking.updateForm({ [field]: value });
  }

  protected setTerms(accepted: boolean): void {
    this.booking.updateForm({ terms: accepted });
    this.touch('terms');
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay(): void {
    const booking = this.booking.current();
    if (!booking) {
      return;
    }
    if (Object.values(this.errors()).some(Boolean)) {
      this.touched.set(ALL_TOUCHED);
      this.toast.show('The form contains errors');
      return;
    }
    const { firstName, lastName, email, phone } = this.form();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats: sortSelections(booking.selections).flatMap((s: Selection) => seatIds(s)),
        customer: { firstName, lastName, email, phone },
        totalPrice: this.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid();
          this.router.navigate(['/confirmation']);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

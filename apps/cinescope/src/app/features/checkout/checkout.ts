import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { CheckoutFormValues } from '../../core/models';
import { formatPrice } from '../../core/pricing.util';
import { computeTotal, groupSelection } from '../../core/selection.util';
import { ToastService } from '../../core/toast.service';

type FieldName = keyof CheckoutFormValues;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: CheckoutFormValues): Record<FieldName, string | null> {
  return {
    firstName:
      values.firstName === ''
        ? 'First name is required'
        : values.firstName.length < 2
          ? 'First name must be at least 2 characters'
          : null,
    lastName:
      values.lastName === ''
        ? 'Last name is required'
        : values.lastName.length < 2
          ? 'Last name must be at least 2 characters'
          : null,
    email: values.email === '' ? 'Email is required' : !EMAIL_RE.test(values.email) ? 'Enter a valid email address' : null,
    confirmEmail:
      values.confirmEmail === ''
        ? 'Confirm email is required'
        : values.confirmEmail !== values.email
          ? 'Email addresses do not match'
          : null,
    phone: values.phone === '' ? null : /^\d{9}$/.test(values.phone) ? null : 'Phone number must be exactly 9 digits',
    terms: values.terms ? null : 'You must accept the terms and conditions',
  };
}

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatCheckboxModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @Input() id = '';

  readonly booking = this.bookingService.booking;
  readonly values = signal<CheckoutFormValues>({ firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false });
  readonly touched = signal<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    terms: false,
  });
  readonly submitting = signal(false);

  readonly errors = computed(() => validateForm(this.values()));
  readonly total = computed(() => computeTotal(this.booking()?.seats ?? []));

  formatPrice = formatPrice;

  ngOnInit(): void {
    const booking = this.booking();
    if (booking) {
      this.values.set({ ...booking.form });
    }
  }

  errorFor(field: FieldName): string | null {
    return this.touched()[field] ? this.errors()[field] : null;
  }

  onInput(field: FieldName, value: string): void {
    this.values.update((v) => ({ ...v, [field]: value }));
    this.bookingService.updateForm({ [field]: value });
  }

  onBlur(field: FieldName): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  onTermsChange(checked: boolean): void {
    this.values.update((v) => ({ ...v, terms: checked }));
    this.bookingService.updateForm({ terms: checked });
    this.touched.update((t) => ({ ...t, terms: true }));
  }

  back(): void {
    this.router.navigateByUrl(`/screenings/${this.id}/summary`);
  }

  pay(): void {
    const errors = this.errors();
    const isValid = Object.values(errors).every((e) => e === null);
    if (!isValid) {
      this.touched.set({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });
      this.toast.show('The form contains errors');
      return;
    }

    const booking = this.booking();
    if (!booking) {
      return;
    }
    const seats = groupSelection(booking.seats).flatMap((r) => r.items.flatMap((i) => i.ids));
    const values = this.values();

    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: Number(this.id),
        seats,
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
          this.bookingService.markPaid(values.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

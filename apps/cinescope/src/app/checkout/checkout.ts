import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../core/api';
import { Booking, CheckoutForm, emptyForm } from '../core/booking';
import { formatPrice } from '../core/seating';
import { Toast } from '../core/toast';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type Field = keyof CheckoutForm;

const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'terms'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly booking = inject(Booking);
  private readonly toast = inject(Toast);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly form = signal<CheckoutForm>(this.booking.current()?.form ?? emptyForm());
  private readonly touched = signal<Partial<Record<Field, boolean>>>({});
  protected readonly paying = signal(false);
  protected readonly payLabel = computed(() =>
    this.paying() ? 'Processing…' : `Pay ${formatPrice(this.booking.total())}`,
  );

  private readonly errors = computed<Record<Field, string | null>>(() => {
    const f = this.form();
    const name = (value: string, label: string) =>
      value === '' ? `${label} is required` : value.length < 2 ? `${label} must be at least 2 characters` : null;
    return {
      firstName: name(f.firstName, 'First name'),
      lastName: name(f.lastName, 'Last name'),
      email: f.email === '' ? 'Email is required' : EMAIL.test(f.email) ? null : 'Enter a valid email address',
      confirmEmail:
        f.confirmEmail === ''
          ? 'Confirm email is required'
          : f.confirmEmail === f.email
            ? null
            : 'Email addresses do not match',
      phone: f.phone === '' || /^\d{9}$/.test(f.phone) ? null : 'Phone number must be exactly 9 digits',
      terms: f.terms ? null : 'You must accept the terms and conditions',
    };
  });

  protected readonly shown = computed(() => {
    const errors = this.errors();
    const touched = this.touched();
    const result: Record<Field, string | null> = {
      firstName: null,
      lastName: null,
      email: null,
      confirmEmail: null,
      phone: null,
      terms: null,
    };
    for (const field of FIELDS) {
      result[field] = touched[field] ? errors[field] : null;
    }
    return result;
  });

  protected setText(field: TextField, value: string): void {
    this.update({ ...this.form(), [field]: value });
  }

  protected setTerms(checked: boolean): void {
    this.update({ ...this.form(), terms: checked });
    this.touch('terms');
  }

  protected touch(field: Field): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'summary']);
  }

  protected pay(): void {
    if (this.paying()) {
      return;
    }
    const errors = this.errors();
    if (FIELDS.some((field) => errors[field])) {
      this.touched.set({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });
      this.toast.show('The form contains errors');
      return;
    }
    const f = this.form();
    const state = this.booking.current();
    if (!state) {
      return;
    }
    this.paying.set(true);
    this.api
      .createReservation({
        screeningId: state.screeningId,
        seats: this.booking.items().flatMap((item) => item.ids),
        customer: { firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(f.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  private update(form: CheckoutForm): void {
    this.form.set(form);
    this.booking.setForm(form);
  }
}

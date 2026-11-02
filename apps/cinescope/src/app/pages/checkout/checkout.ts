import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../core/api';
import { BookingStore, emptyForm } from '../../core/booking';
import { CheckoutValues } from '../../core/models';
import { formatPrice, seatsFromItems } from '../../core/seats';
import { ToastService } from '../../core/toast';

type Field = keyof CheckoutValues;
type Messages = Record<Field, string | null>;

function validateEmail(value: string): boolean {
  if (!/^[^\s@]+@[^\s@]+$/.test(value)) return false;
  const domain = value.slice(value.indexOf('@') + 1);
  return /^.+\..+$/.test(domain);
}

export function validate(values: CheckoutValues): Messages {
  return {
    firstName: !values.firstName
      ? 'First name is required'
      : values.firstName.length < 2
        ? 'First name must be at least 2 characters'
        : null,
    lastName: !values.lastName
      ? 'Last name is required'
      : values.lastName.length < 2
        ? 'Last name must be at least 2 characters'
        : null,
    email: !values.email ? 'Email is required' : validateEmail(values.email) ? null : 'Enter a valid email address',
    confirmEmail: !values.confirmEmail
      ? 'Confirm email is required'
      : values.confirmEmail === values.email
        ? null
        : 'Email addresses do not match',
    phone: values.phone === '' || /^\d{9}$/.test(values.phone) ? null : 'Phone number must be exactly 9 digits',
    terms: values.terms ? null : 'You must accept the terms and conditions',
  };
}

@Component({
  selector: 'app-checkout',
  imports: [MatButton, MatCheckbox, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(BookingStore);
  private readonly toast = inject(ToastService);

  private readonly initial = this.store.booking()?.form ?? emptyForm();

  protected readonly form = new FormGroup({
    firstName: new FormControl(this.initial.firstName, { nonNullable: true }),
    lastName: new FormControl(this.initial.lastName, { nonNullable: true }),
    email: new FormControl(this.initial.email, { nonNullable: true }),
    confirmEmail: new FormControl(this.initial.confirmEmail, { nonNullable: true }),
    phone: new FormControl(this.initial.phone, { nonNullable: true }),
    terms: new FormControl(this.initial.terms, { nonNullable: true }),
  });

  private readonly tick = signal(0);
  protected readonly processing = signal(false);
  protected readonly payLabel = computed(() =>
    this.processing() ? 'Processing…' : `Pay ${formatPrice(this.store.total())}`,
  );

  protected readonly messages = computed<Messages>(() => {
    this.tick();
    const values = this.form.getRawValue();
    const all = validate(values);
    const result = { ...all };
    for (const field of Object.keys(all) as Field[]) {
      if (!this.form.controls[field].touched) result[field] = null;
    }
    return result;
  });

  protected readonly matchers: Record<Field, ErrorStateMatcher> = {
    firstName: this.matcher('firstName'),
    lastName: this.matcher('lastName'),
    email: this.matcher('email'),
    confirmEmail: this.matcher('confirmEmail'),
    phone: this.matcher('phone'),
    terms: this.matcher('terms'),
  };

  constructor() {
    this.form.events.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      this.tick.update((n) => n + 1);
    });
    this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      this.store.setForm(this.form.getRawValue());
    });
  }

  private matcher(field: Field): ErrorStateMatcher {
    return { isErrorState: () => this.form.controls[field].touched && validate(this.form.getRawValue())[field] !== null };
  }

  protected touchTerms(): void {
    this.form.controls.terms.markAsTouched();
    this.tick.update((n) => n + 1);
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.route.snapshot.paramMap.get('id'), 'summary']);
  }

  protected pay(): void {
    if (this.processing()) return;
    const values = this.form.getRawValue();
    if (Object.values(validate(values)).some((message) => message !== null)) {
      this.form.markAllAsTouched();
      this.tick.update((n) => n + 1);
      this.toast.show('The form contains errors');
      return;
    }
    const booking = this.store.booking()!;
    this.processing.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats: seatsFromItems(this.store.items()),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.store.total(),
      })
      .subscribe({
        next: () => {
          this.store.markPaid(values.email);
          this.processing.set(false);
          void this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

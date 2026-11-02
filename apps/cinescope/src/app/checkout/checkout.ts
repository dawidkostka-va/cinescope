import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService, emptyForm } from '../core/booking.service';
import { CheckoutValues } from '../core/models';
import { formatPrice } from '../core/seats';
import { ToastService } from '../core/toast.service';

type FieldName = keyof CheckoutValues;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(field: FieldName, v: CheckoutValues): string | null {
  const requiredText = (label: string, min: number, rule: boolean, message: string) => {
    if (v[field] === '') return `${label} is required`;
    return rule ? null : message;
  };
  switch (field) {
    case 'firstName':
      return requiredText('First name', 2, v.firstName.length >= 2, 'First name must be at least 2 characters');
    case 'lastName':
      return requiredText('Last name', 2, v.lastName.length >= 2, 'Last name must be at least 2 characters');
    case 'email':
      return requiredText('Email', 0, EMAIL_PATTERN.test(v.email), 'Enter a valid email address');
    case 'confirmEmail':
      return requiredText('Confirm email', 0, v.confirmEmail === v.email, 'Email addresses do not match');
    case 'phone':
      return v.phone === '' || /^\d{9}$/.test(v.phone) ? null : 'Phone number must be exactly 9 digits';
    case 'terms':
      return v.terms ? null : 'You must accept the terms and conditions';
  }
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    confirmEmail: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    terms: new FormControl(false, { nonNullable: true }),
  });

  private readonly version = signal(0);
  protected readonly paying = signal(false);
  protected readonly payLabel = computed(() =>
    this.paying() ? 'Processing…' : `Pay ${formatPrice(this.booking.total())}`,
  );

  protected readonly errors = computed(() => {
    this.version();
    const values = this.form.getRawValue();
    const result: Record<FieldName, string | null> = {
      firstName: null,
      lastName: null,
      email: null,
      confirmEmail: null,
      phone: null,
      terms: null,
    };
    for (const name of Object.keys(result) as FieldName[]) {
      result[name] = this.form.controls[name].touched ? validate(name, values) : null;
    }
    return result;
  });

  constructor() {
    this.form.setValue({ ...emptyForm(), ...this.booking.booking()?.form });
    this.form.events.subscribe(() => this.version.update((n) => n + 1));
    this.form.valueChanges.subscribe(() => this.booking.setForm(this.form.getRawValue()));
  }

  protected termsChanged(): void {
    this.form.controls.terms.markAsTouched();
    this.version.update((n) => n + 1);
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay(): void {
    const values = this.form.getRawValue();
    this.form.markAllAsTouched();
    this.version.update((n) => n + 1);
    if ((Object.keys(values) as FieldName[]).some((name) => validate(name, values) !== null)) {
      this.toast.show('The form contains errors');
      return;
    }

    this.paying.set(true);
    this.api
      .createReservation({
        screeningId: this.screeningId,
        seats: this.booking.tickets().flatMap((t) => t.ids),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(values.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

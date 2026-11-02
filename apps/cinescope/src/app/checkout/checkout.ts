import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../api';
import { BookingService, emptyForm } from '../booking';
import { FormValues } from '../models';
import { formatPrice, itemsFromIds } from '../seat-utils';
import { ToastService } from '../toast';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\d{9}$/;

type Field = keyof FormValues;

const LABELS: Record<'firstName' | 'lastName' | 'email' | 'confirmEmail', string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  confirmEmail: 'Confirm email',
};

function nameRule(c: AbstractControl): ValidationErrors | null {
  const v = c.value as string;
  if (v === '') return { required: true };
  return v.length < 2 ? { rule: true } : null;
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private api = inject(Api);
  private router = inject(Router);
  private booking = inject(BookingService);
  private toast = inject(ToastService);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected processing = signal(false);

  private items = computed(() => itemsFromIds(this.booking.booking()?.seats ?? []));
  protected total = computed(() => this.items().reduce((s, i) => s + i.price, 0));
  protected formatPrice = formatPrice;

  protected form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [nameRule] }),
    lastName: new FormControl('', { nonNullable: true, validators: [nameRule] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [(c) => (c.value === '' ? { required: true } : EMAIL.test(c.value) ? null : { rule: true })],
    }),
    confirmEmail: new FormControl('', {
      nonNullable: true,
      validators: [
        (c) => {
          if (c.value === '') return { required: true };
          return c.value === c.parent?.get('email')?.value ? null : { rule: true };
        },
      ],
    }),
    phone: new FormControl('', { nonNullable: true, validators: [(c) => (c.value === '' || PHONE.test(c.value) ? null : { rule: true })] }),
    terms: new FormControl(false, { nonNullable: true, validators: [(c) => (c.value ? null : { required: true })] }),
  });

  constructor() {
    this.form.setValue(this.booking.booking()?.form ?? emptyForm(), { emitEvent: false });
    this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });
    this.form.valueChanges.subscribe(() => this.booking.setForm(this.form.getRawValue()));
    this.form.controls.email.valueChanges.subscribe(() => this.form.controls.confirmEmail.updateValueAndValidity());
  }

  protected error(field: Field): string | null {
    const c = this.form.controls[field];
    if (!c.touched || !c.errors) return null;
    switch (field) {
      case 'firstName':
      case 'lastName':
      case 'email':
      case 'confirmEmail':
        if (c.errors['required']) return `${LABELS[field]} is required`;
        break;
    }
    switch (field) {
      case 'firstName':
        return 'First name must be at least 2 characters';
      case 'lastName':
        return 'Last name must be at least 2 characters';
      case 'email':
        return 'Enter a valid email address';
      case 'confirmEmail':
        return 'Email addresses do not match';
      case 'phone':
        return 'Phone number must be exactly 9 digits';
      default:
        return 'You must accept the terms and conditions';
    }
  }

  protected touchTerms(): void {
    this.form.controls.terms.markAsTouched();
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'summary']);
  }

  protected pay(): void {
    if (this.processing()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const v = this.form.getRawValue();
    this.processing.set(true);
    this.api
      .reserve({
        screeningId: Number(this.id),
        seats: this.items().flatMap((i) => i.ids),
        customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        totalPrice: this.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(v.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

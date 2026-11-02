import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../api.service';
import { BookingService } from '../booking.service';
import { formatPrice } from '../dates';
import { FormValues } from '../models';
import { Toast } from '../toast.service';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rule =
  (check: (value: string, control: AbstractControl) => string | null) =>
  (control: AbstractControl): ValidationErrors | null => {
    const msg = check(control.value as string, control);
    return msg ? { msg } : null;
  };

const nameRule = (label: string) =>
  rule((v) => (v === '' ? `${label} is required` : v.length < 2 ? `${label} must be at least 2 characters` : null));

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly booking = inject(BookingService);
  private readonly toast = inject(Toast);

  protected readonly formatPrice = formatPrice;
  protected readonly paying = signal(false);
  private readonly version = signal(0);

  protected readonly fields: { name: TextField; testId: string; label: string }[] = [
    { name: 'firstName', testId: 'first-name', label: 'First name *' },
    { name: 'lastName', testId: 'last-name', label: 'Last name *' },
    { name: 'email', testId: 'email', label: 'Email *' },
    { name: 'confirmEmail', testId: 'confirm-email', label: 'Confirm email *' },
    { name: 'phone', testId: 'phone', label: 'Phone number' },
  ];

  protected readonly form: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    confirmEmail: FormControl<string>;
    phone: FormControl<string>;
    terms: FormControl<boolean>;
  }>;

  constructor() {
    const saved = this.booking.booking()?.form;
    const nn = <T>(value: T, validators: ((c: AbstractControl) => ValidationErrors | null)[]) =>
      new FormControl(value, { nonNullable: true, validators });
    this.form = new FormGroup({
      firstName: nn(saved?.firstName ?? '', [nameRule('First name')]),
      lastName: nn(saved?.lastName ?? '', [nameRule('Last name')]),
      email: nn(saved?.email ?? '', [
        rule((v) => (v === '' ? 'Email is required' : EMAIL.test(v) ? null : 'Enter a valid email address')),
      ]),
      confirmEmail: nn(saved?.confirmEmail ?? '', [
        rule((v, c) =>
          v === ''
            ? 'Confirm email is required'
            : v === c.parent?.get('email')?.value
              ? null
              : 'Email addresses do not match',
        ),
      ]),
      phone: nn(saved?.phone ?? '', [
        rule((v) => (v === '' || /^[0-9]{9}$/.test(v) ? null : 'Phone number must be exactly 9 digits')),
      ]),
      terms: nn(saved?.terms ?? false, [rule((_, c) => (c.value ? null : 'You must accept the terms and conditions'))]),
    });

    this.form.controls.email.valueChanges.subscribe(() => this.form.controls.confirmEmail.updateValueAndValidity());
    this.form.valueChanges.subscribe(() => this.booking.setForm(this.form.getRawValue() as FormValues));
    this.form.events.subscribe(() => this.version.update((v) => v + 1));
  }

  protected message(name: keyof typeof this.form.controls): string | null {
    this.version();
    const c = this.form.controls[name];
    return c.touched ? ((c.errors?.['msg'] as string | undefined) ?? null) : null;
  }

  protected touchTerms() {
    this.form.controls.terms.markAsTouched();
  }

  protected back() {
    this.router.navigate(['/screenings', this.route.snapshot.paramMap.get('id'), 'summary']);
  }

  protected pay() {
    if (this.paying()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.show('The form contains errors');
      return;
    }
    const v = this.form.getRawValue();
    this.paying.set(true);
    this.api
      .reserve({
        screeningId: Number(this.route.snapshot.paramMap.get('id')),
        seats: this.booking.items().flatMap((i) => i.ids),
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

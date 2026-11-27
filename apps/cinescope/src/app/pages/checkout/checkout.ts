import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService, CheckoutValues, emptyForm } from '../../core/booking.service';
import { toItems, totalOf } from '../../core/seats';
import { ToastService } from '../../core/toast.service';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const required: (c: AbstractControl) => ValidationErrors | null = (c) => (c.value === '' ? { required: true } : null);

const minLength2 = (c: AbstractControl): ValidationErrors | null =>
  required(c) ?? (String(c.value).length >= 2 ? null : { rule: true });

const email = (c: AbstractControl): ValidationErrors | null =>
  required(c) ?? (EMAIL.test(c.value) ? null : { rule: true });

const confirmEmail = (c: AbstractControl): ValidationErrors | null =>
  required(c) ?? (c.value === c.parent?.get('email')?.value ? null : { rule: true });

const phone = (c: AbstractControl): ValidationErrors | null =>
  c.value === '' || /^\d{9}$/.test(c.value) ? null : { rule: true };

const terms = (c: AbstractControl): ValidationErrors | null => (c.value === true ? null : { required: true });

const FIELDS: { name: TextField; id: string; label: string; required: boolean; rule: string }[] = [
  { name: 'firstName', id: 'first-name', label: 'First name', required: true, rule: 'First name must be at least 2 characters' },
  { name: 'lastName', id: 'last-name', label: 'Last name', required: true, rule: 'Last name must be at least 2 characters' },
  { name: 'email', id: 'email', label: 'Email', required: true, rule: 'Enter a valid email address' },
  { name: 'confirmEmail', id: 'confirm-email', label: 'Confirm email', required: true, rule: 'Email addresses do not match' },
  { name: 'phone', id: 'phone', label: 'Phone number', required: false, rule: 'Phone number must be exactly 9 digits' },
];

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly bookingService = inject(BookingService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly fields = FIELDS;
  protected readonly processing = signal(false);

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [minLength2] }),
    lastName: new FormControl('', { nonNullable: true, validators: [minLength2] }),
    email: new FormControl('', { nonNullable: true, validators: [email] }),
    confirmEmail: new FormControl('', { nonNullable: true, validators: [confirmEmail] }),
    phone: new FormControl('', { nonNullable: true, validators: [phone] }),
    terms: new FormControl(false, { nonNullable: true, validators: [terms] }),
  });

  private readonly formEvents = toSignal(this.form.events);

  private readonly items = computed(() => toItems(this.bookingService.booking()?.seats ?? []));
  protected readonly total = computed(() => totalOf(this.items()).toFixed(2));

  constructor() {
    this.form.setValue(this.bookingService.booking()?.form ?? emptyForm(), { emitEvent: false });
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmEmail.updateValueAndValidity());
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.bookingService.saveForm(this.form.getRawValue() as CheckoutValues));
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  protected error(name: TextField): string | null {
    this.formEvents();
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    const field = FIELDS.find((f) => f.name === name)!;
    return control.errors['required'] ? `${field.label} is required` : field.rule;
  }

  protected termsError(): string | null {
    this.formEvents();
    const control = this.form.controls.terms;
    return control.touched && control.errors ? 'You must accept the terms and conditions' : null;
  }

  protected touchTerms() {
    this.form.controls.terms.markAsTouched();
  }

  protected back() {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay() {
    if (this.processing()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const value = this.form.getRawValue();
    this.processing.set(true);
    this.api
      .createReservation({
        screeningId: this.screeningId,
        seats: this.items().flatMap((item) => item.ids),
        customer: {
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          phone: value.phone,
        },
        totalPrice: totalOf(this.items()),
      })
      .subscribe({
        next: () => {
          this.bookingService.markPaid(value.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

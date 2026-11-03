import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Api, parseId } from '../core/api';
import { BookingStore } from '../core/booking';
import { formatPrice } from '../core/seats';
import { ToastService } from '../core/toast';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{9}$/;

const fail = (msg: string): ValidationErrors => ({ msg });

const minLength =
  (label: string): ValidatorFn =>
  (control) =>
    !control.value ? fail(`${label} is required`) : control.value.length < 2 ? fail(`${label} must be at least 2 characters`) : null;

const emailRule: ValidatorFn = (control) =>
  !control.value ? fail('Email is required') : EMAIL_PATTERN.test(control.value) ? null : fail('Enter a valid email address');

const phoneRule: ValidatorFn = (control) =>
  !control.value || PHONE_PATTERN.test(control.value) ? null : fail('Phone number must be exactly 9 digits');

const termsRule: ValidatorFn = (control) => (control.value ? null : fail('You must accept the terms and conditions'));

const confirmEmailRule =
  (email: AbstractControl): ValidatorFn =>
  (control) =>
    !control.value
      ? fail('Confirm email is required')
      : control.value === email.value
        ? null
        : fail('Email addresses do not match');

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly screeningId = parseId(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  protected readonly booking = inject(BookingStore);

  protected readonly format = formatPrice;
  protected readonly processing = signal(false);

  protected readonly form: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    confirmEmail: FormControl<string>;
    phone: FormControl<string>;
    terms: FormControl<boolean>;
  }>;

  constructor() {
    const saved = this.booking.current()!.form;
    const email = new FormControl(saved.email, { nonNullable: true, validators: [emailRule] });
    this.form = new FormGroup({
      firstName: new FormControl(saved.firstName, { nonNullable: true, validators: [minLength('First name')] }),
      lastName: new FormControl(saved.lastName, { nonNullable: true, validators: [minLength('Last name')] }),
      email,
      confirmEmail: new FormControl(saved.confirmEmail, {
        nonNullable: true,
        validators: [confirmEmailRule(email)],
      }),
      phone: new FormControl(saved.phone, { nonNullable: true, validators: [phoneRule] }),
      terms: new FormControl(saved.terms === true, { nonNullable: true, validators: [termsRule] }),
    });

    email.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity({ emitEvent: false });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.booking.saveForm(this.form.getRawValue());
    });
  }

  protected error(name: keyof Checkout['form']['controls']): string | null {
    const control = this.form.controls[name];
    return control.touched ? (control.errors?.['msg'] ?? null) : null;
  }

  protected setTerms(checked: boolean): void {
    const terms = this.form.controls.terms;
    terms.setValue(checked);
    terms.markAsTouched();
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay(): void {
    if (this.processing()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const { firstName, lastName, email, phone } = this.form.getRawValue();
    this.processing.set(true);
    this.api
      .createReservation({
        screeningId: this.screeningId!,
        seats: this.booking.items().flatMap((item) => item.ids),
        customer: { firstName, lastName, email, phone },
        totalPrice: this.booking.total(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.booking.markPaid(email);
          void this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

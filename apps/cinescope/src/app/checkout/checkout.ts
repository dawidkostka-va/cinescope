import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { CheckoutValues } from '../core/models';
import { formatPrice } from '../core/seats';
import { ToastService } from '../core/toast.service';

type FieldName = keyof CheckoutValues;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

const emailValidator = (control: AbstractControl): ValidationErrors | null =>
  control.value === '' || EMAIL_PATTERN.test(control.value) ? null : { email: true };

const phoneValidator = (control: AbstractControl): ValidationErrors | null =>
  control.value === '' || PHONE_PATTERN.test(control.value) ? null : { phone: true };

const confirmEmailValidator = (control: AbstractControl): ValidationErrors | null => {
  if (control.value === '') {
    return null;
  }
  return control.value === control.parent?.get('email')?.value ? null : { mismatch: true };
};

const LABELS: Record<Exclude<FieldName, 'phone' | 'terms'>, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  confirmEmail: 'Confirm email',
};

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly saved = this.booking.booking()?.form;

  protected readonly form = new FormGroup({
    firstName: new FormControl(this.saved?.firstName ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl(this.saved?.lastName ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl(this.saved?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, emailValidator],
    }),
    confirmEmail: new FormControl(this.saved?.confirmEmail ?? '', {
      nonNullable: true,
      validators: [Validators.required, confirmEmailValidator],
    }),
    phone: new FormControl(this.saved?.phone ?? '', { nonNullable: true, validators: [phoneValidator] }),
    terms: new FormControl(this.saved?.terms ?? false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  protected readonly paying = signal(false);
  protected readonly payLabel = computed(() =>
    this.paying() ? 'Processing…' : `Pay ${formatPrice(this.booking.total())}`,
  );

  constructor() {
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.confirmEmail.updateValueAndValidity());
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.booking.saveForm(this.form.getRawValue()));
  }

  protected error(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) {
      return null;
    }
    if (name === 'terms') {
      return 'You must accept the terms and conditions';
    }
    if (name === 'phone') {
      return 'Phone number must be exactly 9 digits';
    }
    if (control.errors['required']) {
      return `${LABELS[name]} is required`;
    }
    switch (name) {
      case 'email':
        return 'Enter a valid email address';
      case 'confirmEmail':
        return 'Email addresses do not match';
      default:
        return `${LABELS[name]} must be at least 2 characters`;
    }
  }

  protected termsToggled(): void {
    this.form.controls.terms.markAsTouched();
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.route.snapshot.paramMap.get('id'), 'summary']);
  }

  protected pay(): void {
    if (this.paying()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const booking = this.booking.booking();
    if (!booking) {
      return;
    }
    const { firstName, lastName, email, phone } = this.form.getRawValue();
    this.paying.set(true);
    this.api
      .reserve({
        screeningId: booking.screeningId,
        seats: this.booking.tickets().flatMap((ticket) => ticket.ids),
        customer: { firstName, lastName, email, phone },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

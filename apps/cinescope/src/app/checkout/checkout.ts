import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { buildSummaryItems, formatPrice } from '../core/auditorium';
import { BookingService } from '../core/booking.service';
import { emailFormatValidator, matchesControl, phoneFormatValidator } from '../core/checkout-validators';
import { ToastService } from '../core/toast.service';

interface CheckoutForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  confirmEmail: FormControl<string>;
  phone: FormControl<string>;
  terms: FormControl<boolean>;
}

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  protected readonly submitting = signal(false);

  protected readonly total = computed(() => {
    const booking = this.bookingService.booking();
    const seats = booking ? booking.seats : [];
    return buildSummaryItems(seats).reduce((sum, item) => sum + item.price, 0);
  });

  protected readonly form = new FormGroup<CheckoutForm>({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, emailFormatValidator] }),
    confirmEmail: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [phoneFormatValidator] }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  constructor() {
    const booking = this.bookingService.booking();
    if (booking) {
      this.form.patchValue(booking.form);
    }

    this.form.controls.confirmEmail.addValidators(matchesControl(this.form.controls.email));
    this.form.controls.email.valueChanges.subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity({ onlySelf: true });
    });

    this.form.valueChanges.subscribe((value) => {
      this.bookingService.setForm({
        firstName: value.firstName ?? '',
        lastName: value.lastName ?? '',
        email: value.email ?? '',
        confirmEmail: value.confirmEmail ?? '',
        phone: value.phone ?? '',
        terms: value.terms ?? false,
      });
    });
  }

  protected firstNameError(): string | null {
    const c = this.form.controls.firstName;
    if (!c.touched) {
      return null;
    }
    if (c.hasError('required')) {
      return 'First name is required';
    }
    if (c.hasError('minlength')) {
      return 'First name must be at least 2 characters';
    }
    return null;
  }

  protected lastNameError(): string | null {
    const c = this.form.controls.lastName;
    if (!c.touched) {
      return null;
    }
    if (c.hasError('required')) {
      return 'Last name is required';
    }
    if (c.hasError('minlength')) {
      return 'Last name must be at least 2 characters';
    }
    return null;
  }

  protected emailError(): string | null {
    const c = this.form.controls.email;
    if (!c.touched) {
      return null;
    }
    if (c.hasError('required')) {
      return 'Email is required';
    }
    if (c.hasError('emailFormat')) {
      return 'Enter a valid email address';
    }
    return null;
  }

  protected confirmEmailError(): string | null {
    const c = this.form.controls.confirmEmail;
    if (!c.touched) {
      return null;
    }
    if (c.hasError('required')) {
      return 'Confirm email is required';
    }
    if (c.hasError('mismatch')) {
      return 'Email addresses do not match';
    }
    return null;
  }

  protected phoneError(): string | null {
    const c = this.form.controls.phone;
    if (!c.touched) {
      return null;
    }
    if (c.hasError('phoneFormat')) {
      return 'Phone number must be exactly 9 digits';
    }
    return null;
  }

  protected termsError(): string | null {
    const c = this.form.controls.terms;
    if (!c.touched) {
      return null;
    }
    if (c.hasError('required')) {
      return 'You must accept the terms and conditions';
    }
    return null;
  }

  protected onTermsChanged(): void {
    this.form.controls.terms.markAsTouched();
  }

  protected onBack(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  protected readonly formatPrice = formatPrice;

  protected onPay(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }

    const booking = this.bookingService.booking();
    if (!booking) {
      return;
    }

    const items = buildSummaryItems(booking.seats);
    const value = this.form.getRawValue();
    const payload = {
      screeningId: this.screeningId(),
      seats: items.flatMap((item) => item.seatIds),
      customer: {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phone: value.phone,
      },
      totalPrice: this.total(),
    };

    this.submitting.set(true);
    this.api.createReservation(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.bookingService.markPaid(value.email);
        this.router.navigateByUrl('/confirmation');
      },
      error: () => {
        this.submitting.set(false);
        this.toast.show('Payment failed. Please try again.');
      },
    });
  }
}

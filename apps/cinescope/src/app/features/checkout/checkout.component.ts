import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { BookingService } from '../../core/services/booking.service';
import { ToastService } from '../../core/services/toast.service';
import { BookingForm } from '../../core/models/booking.model';
import { buildSummaryEntries, formatPrice } from '../../core/utils/seat.util';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  confirmEmail: 'Confirm email',
  phone: 'Phone number',
};

function emailPatternValidator(control: { value: string }): ValidationErrors | null {
  if (!control.value) return null;
  return EMAIL_PATTERN.test(control.value) ? null : { email: true };
}

function phonePatternValidator(control: { value: string }): ValidationErrors | null {
  if (!control.value) return null;
  return PHONE_PATTERN.test(control.value) ? null : { phonePattern: true };
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  private readonly screeningId = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))), {
    initialValue: NaN,
  });

  readonly submitting = signal(false);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, emailPatternValidator]],
    confirmEmail: ['', [Validators.required]],
    phone: ['', [phonePatternValidator]],
    terms: [false, [Validators.requiredTrue]],
  });

  readonly total = computed(() => {
    const booking = this.bookingService.booking();
    if (!booking) return 0;
    return buildSummaryEntries(booking.seats).reduce((sum, entry) => sum + entry.price, 0);
  });
  readonly payButtonText = computed(() => (this.submitting() ? 'Processing…' : `Pay ${formatPrice(this.total())}`));

  constructor() {
    const emailControl = this.form.controls.email;
    const confirmEmailControl = this.form.controls.confirmEmail;
    confirmEmailControl.addValidators((control) => {
      if (!control.value) return null;
      return control.value === emailControl.value ? null : { mismatch: true };
    });
    emailControl.valueChanges.subscribe(() => confirmEmailControl.updateValueAndValidity());

    const savedForm = this.bookingService.booking()?.form;
    if (savedForm) {
      this.form.patchValue(savedForm, { emitEvent: false });
    }

    this.form.valueChanges.subscribe((value) => {
      this.bookingService.updateForm(value as Partial<BookingForm>);
    });
  }

  onTermsChange(): void {
    this.form.controls.terms.markAsTouched();
  }

  errorMessage(field: keyof typeof FIELD_LABELS): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';
    const errors = control.errors;
    const label = FIELD_LABELS[field];
    if (errors['required']) return `${label} is required`;
    if (errors['minlength']) return `${label} must be at least 2 characters`;
    if (errors['email']) return 'Enter a valid email address';
    if (errors['mismatch']) return 'Email addresses do not match';
    if (errors['phonePattern']) return 'Phone number must be exactly 9 digits';
    return '';
  }

  termsErrorMessage(): string {
    return this.form.controls.terms.hasError('required') ? 'You must accept the terms and conditions' : '';
  }

  showError(field: keyof typeof FIELD_LABELS): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  showTermsError(): boolean {
    const control = this.form.controls.terms;
    return control.invalid && control.touched;
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }

    const booking = this.bookingService.booking();
    if (!booking) return;

    const entries = buildSummaryEntries(booking.seats);
    const total = entries.reduce((sum, entry) => sum + entry.price, 0);
    const seats = entries.flatMap((entry) => entry.identifiers);
    const value = this.form.getRawValue();

    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: this.screeningId(),
        seats,
        customer: {
          firstName: value.firstName ?? '',
          lastName: value.lastName ?? '',
          email: value.email ?? '',
          phone: value.phone ?? '',
        },
        totalPrice: total,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.bookingService.markPaid(value.email ?? '');
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

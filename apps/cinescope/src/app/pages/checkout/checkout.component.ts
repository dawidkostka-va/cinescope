import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { ToastService } from '../../core/toast.service';
import { formatPrice } from '../../core/date.util';
import { buildTickets } from '../../core/seat-map.util';

type FieldName = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'termsAccepted';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (value === '') return null;
  return /^\d{9}$/.test(value) ? null : { pattern: true };
}

function confirmEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (value === '') return null;
  const email: string = control.parent?.get('email')?.value ?? '';
  return email === value ? null : { mismatch: true };
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

  readonly screeningId = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))), {
    initialValue: NaN,
  });

  readonly submitting = signal(false);
  readonly touched = signal<Set<FieldName>>(new Set());
  readonly formatPrice = formatPrice;

  readonly total = computed(() => buildTickets(this.bookingService.booking()?.seats ?? []).reduce((sum, t) => sum + t.price, 0));

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    confirmEmail: ['', [Validators.required, confirmEmailValidator as ValidatorFn]],
    phone: ['', [phoneValidator]],
    termsAccepted: [false, [Validators.requiredTrue]],
  });

  private readonly errorMessages: Record<FieldName, Record<string, string>> = {
    firstName: { required: 'First name is required', minlength: 'First name must be at least 2 characters' },
    lastName: { required: 'Last name is required', minlength: 'Last name must be at least 2 characters' },
    email: { required: 'Email is required', pattern: 'Enter a valid email address' },
    confirmEmail: { required: 'Confirm email is required', mismatch: 'Email addresses do not match' },
    phone: { pattern: 'Phone number must be exactly 9 digits' },
    termsAccepted: { required: 'You must accept the terms and conditions' },
  };

  constructor() {
    const initial = this.bookingService.booking()?.form;
    if (initial) {
      this.form.patchValue(initial, { emitEvent: false });
    }

    this.form.controls.email.valueChanges.subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    this.form.valueChanges.subscribe((value) => {
      this.bookingService.updateForm(value);
    });
  }

  markTouched(name: FieldName): void {
    const next = new Set(this.touched());
    next.add(name);
    this.touched.set(next);
  }

  errorFor(name: FieldName): string | null {
    if (!this.touched().has(name)) return null;
    const control = this.form.controls[name];
    const errors = control.errors;
    if (!errors) return null;
    const messages = this.errorMessages[name];
    for (const key of Object.keys(messages)) {
      if (errors[key]) return messages[key];
    }
    return null;
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  pay(): void {
    if (this.form.invalid) {
      this.touched.set(new Set<FieldName>(['firstName', 'lastName', 'email', 'confirmEmail', 'phone', 'termsAccepted']));
      this.toast.show('The form contains errors');
      return;
    }

    this.submitting.set(true);
    const tickets = buildTickets(this.bookingService.booking()?.seats ?? []);
    const seats = tickets.flatMap((t) => t.ids);
    const totalPrice = tickets.reduce((sum, t) => sum + t.price, 0);
    const value = this.form.getRawValue();

    this.api
      .createReservation({
        screeningId: this.screeningId(),
        seats,
        customer: { firstName: value.firstName, lastName: value.lastName, email: value.email, phone: value.phone },
        totalPrice,
      })
      .subscribe({
        next: () => {
          this.bookingService.markPaid(value.email);
          this.submitting.set(false);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

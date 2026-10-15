import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService, CheckoutFormValues } from '../../core/booking.service';
import { emailFormatValidator, matchesControlValidator, phoneFormatValidator } from '../../core/checkout-validators';
import { ReservationRequest } from '../../core/models';
import { ScreeningData } from '../../core/screening-resolver';
import { formatPrice, groupBookingSeats } from '../../core/seats';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCheckboxModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  private readonly routeData = toSignal(this.route.data, { requireSync: true }) as () => Data;
  protected readonly screening = computed(() => (this.routeData()['data'] as ScreeningData).screening);

  protected readonly submitting = signal(false);

  protected readonly total = computed(() =>
    groupBookingSeats(this.booking.booking()?.seats ?? []).reduce((sum, item) => sum + item.price, 0),
  );

  private readonly initialValues: CheckoutFormValues = this.booking.booking()?.form ?? {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    terms: false,
  };

  protected readonly form = this.fb.nonNullable.group({
    firstName: [this.initialValues.firstName, [Validators.required, Validators.minLength(2)]],
    lastName: [this.initialValues.lastName, [Validators.required, Validators.minLength(2)]],
    email: [this.initialValues.email, [Validators.required, emailFormatValidator()]],
    confirmEmail: [this.initialValues.confirmEmail, [Validators.required, matchesControlValidator('email')]],
    phone: [this.initialValues.phone, [phoneFormatValidator()]],
    terms: [this.initialValues.terms, [Validators.requiredTrue]],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.booking.updateForm(value as CheckoutFormValues);
    });

    this.form.controls.email.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.confirmEmail.updateValueAndValidity({ onlySelf: true });
    });
  }

  protected errorMessage(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    const errors = control.errors;
    if (errors['required']) {
      return name === 'terms' ? 'You must accept the terms and conditions' : `${this.labelFor(name)} is required`;
    }
    if (errors['minlength']) return `${this.labelFor(name)} must be at least 2 characters`;
    if (errors['emailFormat']) return 'Enter a valid email address';
    if (errors['mismatch']) return 'Email addresses do not match';
    if (errors['phoneFormat']) return 'Phone number must be exactly 9 digits';
    return null;
  }

  private labelFor(name: string): string {
    const labels: Record<string, string> = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      confirmEmail: 'Confirm email',
    };
    return labels[name] ?? name;
  }

  protected price(amount: number): string {
    return formatPrice(amount);
  }

  protected onTermsChange(): void {
    this.form.controls.terms.markAsTouched();
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screening().id, 'summary']);
  }

  protected pay(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }

    this.submitting.set(true);
    const value = this.form.getRawValue();
    const seats = groupBookingSeats(this.booking.booking()!.seats).flatMap((item) => item.ids);
    const payload: ReservationRequest = {
      screeningId: this.screening().id,
      seats,
      customer: {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phone: value.phone,
      },
      totalPrice: this.total(),
    };

    this.api.createReservation(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.booking.markPaid(value.email);
        this.router.navigateByUrl('/confirmation');
      },
      error: () => {
        this.submitting.set(false);
        this.toast.show('Payment failed. Please try again.');
      },
    });
  }
}

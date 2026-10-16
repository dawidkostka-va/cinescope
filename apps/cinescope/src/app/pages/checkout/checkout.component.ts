import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { ToastService } from '../../core/toast.service';
import { CreateReservationPayload } from '../../core/models';
import { emptyForm } from '../../core/booking.model';
import { formatPrice } from '../../shared/seat-utils';
import { buildSummaryItems } from '../../shared/grouping';

type FieldName = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'termsAccepted';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  protected readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));
  private readonly initialForm = this.bookingService.booking()?.form ?? emptyForm();

  protected readonly firstName = signal(this.initialForm.firstName);
  protected readonly lastName = signal(this.initialForm.lastName);
  protected readonly email = signal(this.initialForm.email);
  protected readonly confirmEmail = signal(this.initialForm.confirmEmail);
  protected readonly phone = signal(this.initialForm.phone);
  protected readonly termsAccepted = signal(this.initialForm.termsAccepted);

  protected readonly touched = signal<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    termsAccepted: false,
  });

  protected readonly submitting = signal(false);

  protected readonly items = computed(() => buildSummaryItems(this.bookingService.booking()?.seats ?? []));
  protected readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));
  protected readonly formatPrice = formatPrice;

  protected readonly firstNameError = computed(() => requiredMinLength(this.firstName(), 'First name', 2));
  protected readonly lastNameError = computed(() => requiredMinLength(this.lastName(), 'Last name', 2));

  protected readonly emailError = computed(() => {
    const value = this.email();
    if (!value) {
      return 'Email is required';
    }
    return EMAIL_RE.test(value) ? null : 'Enter a valid email address';
  });

  protected readonly confirmEmailError = computed(() => {
    const value = this.confirmEmail();
    if (!value) {
      return 'Confirm email is required';
    }
    return value === this.email() ? null : 'Email addresses do not match';
  });

  protected readonly phoneError = computed(() => {
    const value = this.phone();
    if (!value) {
      return null;
    }
    return /^\d{9}$/.test(value) ? null : 'Phone number must be exactly 9 digits';
  });

  protected readonly termsError = computed(() => (this.termsAccepted() ? null : 'You must accept the terms and conditions'));

  protected readonly formValid = computed(
    () =>
      !this.firstNameError() &&
      !this.lastNameError() &&
      !this.emailError() &&
      !this.confirmEmailError() &&
      !this.phoneError() &&
      !this.termsError(),
  );

  constructor() {
    effect(() => {
      this.bookingService.updateForm({
        firstName: this.firstName(),
        lastName: this.lastName(),
        email: this.email(),
        confirmEmail: this.confirmEmail(),
        phone: this.phone(),
        termsAccepted: this.termsAccepted(),
      });
    });
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected touch(field: FieldName): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  protected onTermsChange(event: MatCheckboxChange): void {
    this.termsAccepted.set(event.checked);
    this.touch('termsAccepted');
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected pay(): void {
    if (this.submitting()) {
      return;
    }
    if (!this.formValid()) {
      this.touched.set({
        firstName: true,
        lastName: true,
        email: true,
        confirmEmail: true,
        phone: true,
        termsAccepted: true,
      });
      this.toast.show('The form contains errors');
      return;
    }
    const seats = this.items().flatMap((item) => item.ids);
    const payload: CreateReservationPayload = {
      screeningId: this.screeningId,
      seats,
      customer: {
        firstName: this.firstName(),
        lastName: this.lastName(),
        email: this.email(),
        phone: this.phone(),
      },
      totalPrice: this.total(),
    };
    this.submitting.set(true);
    this.api.createReservation(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.bookingService.markPaid(this.email());
        this.router.navigateByUrl('/confirmation');
      },
      error: () => {
        this.submitting.set(false);
        this.toast.show('Payment failed. Please try again.');
      },
    });
  }
}

function requiredMinLength(value: string, label: string, min: number): string | null {
  if (!value) {
    return `${label} is required`;
  }
  return value.length < min ? `${label} must be at least ${min} characters` : null;
}

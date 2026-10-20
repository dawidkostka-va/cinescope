import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { BookingService } from '../../core/booking.service';
import { confirmEmailError, emailError, firstNameError, lastNameError, phoneError, termsError } from '../../core/checkout-validation';
import { CheckoutFormValues } from '../../core/models';
import { ReservationsService } from '../../core/reservations.service';
import { groupSelection } from '../../core/selection.util';
import { formatPrice } from '../../core/seat-map.util';
import { ToastService } from '../../core/toast.service';

type FieldName = keyof CheckoutFormValues;

interface FieldErrors {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  confirmEmail: string | null;
  phone: string | null;
  terms: string | null;
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCheckboxModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly reservationsService = inject(ReservationsService);
  private readonly toast = inject(ToastService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  private readonly initialForm = this.bookingService.booking().form;

  readonly form = new FormGroup({
    firstName: new FormControl(this.initialForm.firstName, { nonNullable: true }),
    lastName: new FormControl(this.initialForm.lastName, { nonNullable: true }),
    email: new FormControl(this.initialForm.email, { nonNullable: true }),
    confirmEmail: new FormControl(this.initialForm.confirmEmail, { nonNullable: true }),
    phone: new FormControl(this.initialForm.phone, { nonNullable: true }),
    terms: new FormControl(this.initialForm.terms, { nonNullable: true }),
  });

  readonly values = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  readonly touched = signal<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    terms: false,
  });

  readonly submitting = signal(false);

  readonly errors = computed<FieldErrors>(() => {
    const v = this.values();
    return {
      firstName: firstNameError(v.firstName),
      lastName: lastNameError(v.lastName),
      email: emailError(v.email),
      confirmEmail: confirmEmailError(v.confirmEmail, v.email),
      phone: phoneError(v.phone),
      terms: termsError(v.terms),
    };
  });

  readonly isValid = computed(() => Object.values(this.errors()).every((error) => error === null));

  readonly total = computed(() => groupSelection(this.bookingService.booking().seats).reduce((sum, item) => sum + item.price, 0));
  readonly payLabel = computed(() => `Pay ${formatPrice(this.total())}`);

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.bookingService.setFormValues(this.form.getRawValue());
    });
  }

  markTouched(field: FieldName): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  errorFor(field: FieldName): string | null {
    return this.touched()[field] ? this.errors()[field] : null;
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  pay(): void {
    this.touched.set({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });

    if (!this.isValid()) {
      this.toast.show('The form contains errors');
      return;
    }

    const v = this.values();
    const items = groupSelection(this.bookingService.booking().seats);
    const seats = items.flatMap((item) => item.ids);
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

    this.submitting.set(true);
    this.reservationsService
      .create({
        screeningId: this.screeningId(),
        seats,
        customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        totalPrice,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.bookingService.markPaid(v.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

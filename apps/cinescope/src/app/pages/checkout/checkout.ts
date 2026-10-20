import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckoutFormValues, emptyCheckoutForm } from '../../models/booking.model';
import { ApiService } from '../../services/api.service';
import { BookingService } from '../../services/booking.service';
import { ToastService } from '../../services/toast.service';
import { formatPrice } from '../../utils/seat.util';
import { groupIntoUnits } from '../../utils/selection.util';

type FieldName = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone' | 'terms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly screeningId = Number(this.route.snapshot.paramMap.get('id'));

  readonly submitting = signal(false);
  private readonly touched = signal<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    phone: false,
    terms: false,
  });

  readonly values = computed<CheckoutFormValues>(() => this.bookingService.booking()?.form ?? emptyCheckoutForm());

  readonly total = computed(() =>
    groupIntoUnits(this.bookingService.booking()?.seats ?? []).reduce((sum, unit) => sum + unit.price, 0),
  );
  readonly payLabel = computed(() => `Pay ${formatPrice(this.total())}`);

  private readonly allErrors = computed(() => this.computeErrors(this.values()));

  readonly errors = computed(() => {
    const touched = this.touched();
    const all = this.allErrors();
    const result: Record<FieldName, string | null> = {
      firstName: touched.firstName ? all.firstName : null,
      lastName: touched.lastName ? all.lastName : null,
      email: touched.email ? all.email : null,
      confirmEmail: touched.confirmEmail ? all.confirmEmail : null,
      phone: touched.phone ? all.phone : null,
      terms: touched.terms ? all.terms : null,
    };
    return result;
  });

  private computeErrors(values: CheckoutFormValues): Record<FieldName, string | null> {
    return {
      firstName:
        values.firstName === ''
          ? 'First name is required'
          : values.firstName.length < 2
            ? 'First name must be at least 2 characters'
            : null,
      lastName:
        values.lastName === ''
          ? 'Last name is required'
          : values.lastName.length < 2
            ? 'Last name must be at least 2 characters'
            : null,
      email: values.email === '' ? 'Email is required' : !EMAIL_PATTERN.test(values.email) ? 'Enter a valid email address' : null,
      confirmEmail:
        values.confirmEmail === ''
          ? 'Confirm email is required'
          : values.confirmEmail !== values.email
            ? 'Email addresses do not match'
            : null,
      phone: values.phone === '' ? null : !PHONE_PATTERN.test(values.phone) ? 'Phone number must be exactly 9 digits' : null,
      terms: values.terms ? null : 'You must accept the terms and conditions',
    };
  }

  update(field: FieldName, value: string): void {
    this.bookingService.updateForm({ [field]: value } as Partial<CheckoutFormValues>);
  }

  markTouched(field: FieldName): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  toggleTerms(checked: boolean): void {
    this.bookingService.updateForm({ terms: checked });
    this.markTouched('terms');
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  pay(): void {
    if (this.submitting()) return;
    const values = this.values();
    const errors = this.computeErrors(values);
    const valid = Object.values(errors).every((e) => e === null);
    if (!valid) {
      this.touched.set({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });
      this.toast.show('The form contains errors');
      return;
    }
    const seats = groupIntoUnits(this.bookingService.booking()?.seats ?? []).flatMap((unit) => unit.ids);
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: this.screeningId,
        seats,
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.total(),
      })
      .subscribe({
        next: () => {
          this.bookingService.markPaid(values.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

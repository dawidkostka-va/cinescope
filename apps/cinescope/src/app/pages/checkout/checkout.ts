import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService, EMPTY_FORM } from '../../core/booking.service';
import { FormValues } from '../../core/models';
import { formatPrice } from '../../core/seating';
import { ToastService } from '../../core/toast.service';

type TextField = 'firstName' | 'lastName' | 'email' | 'confirmEmail' | 'phone';
type Field = TextField | 'terms';

const LABELS: Record<TextField, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  confirmEmail: 'Confirm email',
  phone: 'Phone number',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): Record<Field, string | null> {
  const minLength = (field: 'firstName' | 'lastName') =>
    values[field] === ''
      ? `${LABELS[field]} is required`
      : values[field].length < 2
        ? `${LABELS[field]} must be at least 2 characters`
        : null;

  return {
    firstName: minLength('firstName'),
    lastName: minLength('lastName'),
    email:
      values.email === ''
        ? 'Email is required'
        : !EMAIL_PATTERN.test(values.email)
          ? 'Enter a valid email address'
          : null,
    confirmEmail:
      values.confirmEmail === ''
        ? 'Confirm email is required'
        : values.confirmEmail !== values.email
          ? 'Email addresses do not match'
          : null,
    phone: values.phone !== '' && !/^[0-9]{9}$/.test(values.phone) ? 'Phone number must be exactly 9 digits' : null,
    terms: values.terms ? null : 'You must accept the terms and conditions',
  };
}

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly bookingService = inject(BookingService);
  private readonly screeningId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly values = signal<FormValues>({ ...EMPTY_FORM, ...this.bookingService.booking()?.form });
  private readonly touched = signal<ReadonlySet<Field>>(new Set());
  protected readonly processing = signal(false);

  private readonly problems = computed(() => validate(this.values()));
  protected readonly errors = computed(() => {
    const touched = this.touched();
    const problems = this.problems();
    const result = {} as Record<Field, string | null>;
    for (const field of Object.keys(problems) as Field[]) result[field] = touched.has(field) ? problems[field] : null;
    return result;
  });

  protected readonly payLabel = computed(() =>
    this.processing() ? 'Processing…' : `Pay ${formatPrice(this.bookingService.total())}`,
  );

  protected setText(field: TextField, event: Event): void {
    this.update({ [field]: (event.target as HTMLInputElement).value });
  }

  protected setTerms(checked: boolean): void {
    this.update({ terms: checked });
    this.touch('terms');
  }

  protected touch(field: Field): void {
    this.touched.update((set) => new Set(set).add(field));
  }

  private update(patch: Partial<FormValues>): void {
    const next = { ...this.values(), ...patch };
    this.values.set(next);
    this.bookingService.setForm(next);
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }

  protected async pay(): Promise<void> {
    if (this.processing()) return;
    const values = this.values();
    const problems = this.problems();
    if (Object.values(problems).some((message) => message !== null)) {
      this.touched.set(new Set(Object.keys(problems) as Field[]));
      this.toast.show('The form contains errors');
      return;
    }

    this.processing.set(true);
    try {
      await this.api.createReservation({
        screeningId: Number(this.screeningId),
        seats: this.bookingService.items().flatMap((item) => item.ids),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.bookingService.total(),
      });
    } catch {
      this.processing.set(false);
      this.toast.show('Payment failed. Please try again.');
      return;
    }
    this.bookingService.markPaid(values.email);
    await this.router.navigateByUrl('/confirmation');
  }
}

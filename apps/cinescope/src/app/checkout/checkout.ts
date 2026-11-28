import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService, CheckoutForm, emptyForm } from '../core/booking.service';
import { formatPrice } from '../core/seating';
import { ToastService } from '../core/toast.service';

type TextKey = Exclude<keyof CheckoutForm, 'terms'>;
type FieldKey = keyof CheckoutForm;

interface TextField {
  key: TextKey;
  label: string;
  required: boolean;
  testPrefix: string;
  type: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{9}$/;

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly fields: TextField[] = [
    { key: 'firstName', label: 'First name', required: true, testPrefix: 'first-name', type: 'text' },
    { key: 'lastName', label: 'Last name', required: true, testPrefix: 'last-name', type: 'text' },
    { key: 'email', label: 'Email', required: true, testPrefix: 'email', type: 'text' },
    { key: 'confirmEmail', label: 'Confirm email', required: true, testPrefix: 'confirm-email', type: 'text' },
    { key: 'phone', label: 'Phone number', required: false, testPrefix: 'phone', type: 'text' },
  ];

  protected readonly form = computed(() => this.booking.booking()?.form ?? emptyForm());
  protected readonly payLabel = computed(() => `Pay ${formatPrice(this.booking.total())}`);
  protected readonly paying = signal(false);
  private readonly touched = signal<Partial<Record<FieldKey, boolean>>>({});

  private readonly messages = computed<Record<FieldKey, string | null>>(() => {
    const f = this.form();
    const required = (value: string, label: string) => (value === '' ? `${label} is required` : null);
    return {
      firstName:
        required(f.firstName, 'First name') ??
        (f.firstName.length < 2 ? 'First name must be at least 2 characters' : null),
      lastName:
        required(f.lastName, 'Last name') ??
        (f.lastName.length < 2 ? 'Last name must be at least 2 characters' : null),
      email: required(f.email, 'Email') ?? (EMAIL_PATTERN.test(f.email) ? null : 'Enter a valid email address'),
      confirmEmail:
        required(f.confirmEmail, 'Confirm email') ??
        (f.confirmEmail === f.email ? null : 'Email addresses do not match'),
      phone: f.phone === '' || PHONE_PATTERN.test(f.phone) ? null : 'Phone number must be exactly 9 digits',
      terms: f.terms ? null : 'You must accept the terms and conditions',
    };
  });

  protected error(key: FieldKey): string | null {
    return this.touched()[key] ? this.messages()[key] : null;
  }

  protected onInput(key: TextKey, event: Event): void {
    this.booking.patchForm({ [key]: (event.target as HTMLInputElement).value });
  }

  protected onBlur(key: FieldKey): void {
    this.touched.update((t) => ({ ...t, [key]: true }));
  }

  protected onTerms(checked: boolean): void {
    this.booking.patchForm({ terms: checked });
    this.onBlur('terms');
  }

  protected pay(): void {
    if (this.paying()) return;
    const messages = this.messages();
    if (Object.values(messages).some((m) => m !== null)) {
      this.touched.set({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });
      this.toast.show('The form contains errors');
      return;
    }
    const f = this.form();
    this.paying.set(true);
    this.api
      .reserve({
        screeningId: this.screeningId,
        seats: this.booking.items().flatMap((item) => item.ids),
        customer: { firstName: f.firstName, lastName: f.lastName, email: f.email, phone: f.phone },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(f.email);
          this.paying.set(false);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'summary']);
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService, emptyForm } from '../core/booking.service';
import { CustomerForm } from '../core/models';
import { ToastService } from '../core/toast.service';
import { FieldName, validate } from './validation';

type TextField = Exclude<FieldName, 'terms'>;

const TEXT_FIELDS: { key: TextField; id: string; label: string }[] = [
  { key: 'firstName', id: 'first-name', label: 'First name *' },
  { key: 'lastName', id: 'last-name', label: 'Last name *' },
  { key: 'email', id: 'email', label: 'Email *' },
  { key: 'confirmEmail', id: 'confirm-email', label: 'Confirm email *' },
  { key: 'phone', id: 'phone', label: 'Phone number' },
];

@Component({
  selector: 'app-checkout',
  imports: [MatButton, MatCheckbox, MatFormField, MatInput, MatLabel],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly fields = TEXT_FIELDS;
  protected readonly values = signal<CustomerForm>(this.bookingService.booking()?.form ?? emptyForm());
  private readonly touched = signal<Partial<Record<FieldName, boolean>>>({});
  private readonly errors = computed(() => validate(this.values()));

  protected readonly processing = signal(false);
  protected readonly payLabel = computed(() =>
    this.processing() ? 'Processing…' : `Pay ${this.bookingService.total().toFixed(2)} PLN`,
  );

  protected error(field: FieldName): string | null {
    return this.touched()[field] ? this.errors()[field] : null;
  }

  protected touch(field: FieldName): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  protected onInput(field: TextField, event: Event): void {
    this.update({ [field]: (event.target as HTMLInputElement).value });
  }

  protected onTerms(checked: boolean): void {
    this.update({ terms: checked });
    this.touch('terms');
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'summary']);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.processing()) return;

    const errors = this.errors();
    if (Object.values(errors).some((e) => e !== null)) {
      this.touched.set({ firstName: true, lastName: true, email: true, confirmEmail: true, phone: true, terms: true });
      this.toast.show('The form contains errors');
      return;
    }

    const v = this.values();
    this.processing.set(true);
    this.api
      .createReservation({
        screeningId: Number(this.id),
        seats: this.bookingService.tickets().flatMap((t) => t.ids),
        customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        totalPrice: this.bookingService.total(),
      })
      .subscribe({
        next: () => {
          this.bookingService.markPaid(v.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }

  private update(change: Partial<CustomerForm>): void {
    this.values.update((v) => ({ ...v, ...change }));
    this.bookingService.setForm(this.values());
  }
}

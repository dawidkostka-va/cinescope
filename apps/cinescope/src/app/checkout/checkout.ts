import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService, EMPTY_FORM } from '../core/booking.service';
import { FormValues } from '../core/models';
import { compareKeys, pln, seatIds, totalPrice } from '../core/seats';
import { ToastService } from '../core/toast.service';
import { FIELDS, Field, TextField, isValid, validate } from './validation';

@Component({
  selector: 'app-checkout',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly values = signal<FormValues>({
    ...EMPTY_FORM,
    ...this.booking.booking()?.form,
  });
  private readonly touched = signal<Record<Field, boolean>>(this.untouched());
  protected readonly paying = signal(false);

  private readonly validation = computed(() => validate(this.values()));

  protected readonly errors = computed(() => {
    const result = this.validation();
    const touched = this.touched();
    return Object.fromEntries(FIELDS.map((f) => [f, touched[f] ? result[f] : null])) as Record<
      Field,
      string | null
    >;
  });

  private readonly items = computed(() =>
    [...(this.booking.booking()?.items ?? [])].sort(compareKeys),
  );
  protected readonly total = computed(() => pln(totalPrice(this.items())));

  private untouched(): Record<Field, boolean> {
    return Object.fromEntries(FIELDS.map((f) => [f, false])) as Record<Field, boolean>;
  }

  protected onInput(field: TextField, event: Event): void {
    this.setValues({ ...this.values(), [field]: (event.target as HTMLInputElement).value });
  }

  protected onTerms(checked: boolean): void {
    this.setValues({ ...this.values(), terms: checked });
    this.touch('terms');
  }

  protected touch(field: Field): void {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  private setValues(values: FormValues): void {
    this.values.set(values);
    this.booking.setForm(values);
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.booking.booking()?.screeningId, 'summary']);
  }

  protected pay(): void {
    if (this.paying()) return;
    if (!isValid(this.validation())) {
      this.touched.set(Object.fromEntries(FIELDS.map((f) => [f, true])) as Record<Field, boolean>);
      this.toast.show('The form contains errors');
      return;
    }
    const booking = this.booking.booking();
    if (!booking) return;
    const items = this.items();
    const v = this.values();
    this.paying.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats: items.flatMap(seatIds),
        customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        totalPrice: totalPrice(items),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(v.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.paying.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { BookingForm } from '../core/models';
import { formatPrice } from '../core/seats';
import { ToastService } from '../core/toast.service';
import {
  confirmEmailValidator,
  emailValidator,
  minLengthField,
  phoneValidator,
  termsValidator,
} from './validators';

@Component({
  selector: 'app-checkout',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly booking = inject(BookingService);

  private readonly initial = this.booking.booking()?.form;

  protected readonly form = new FormGroup({
    firstName: new FormControl(this.initial?.firstName ?? '', {
      nonNullable: true,
      validators: minLengthField('First name'),
    }),
    lastName: new FormControl(this.initial?.lastName ?? '', {
      nonNullable: true,
      validators: minLengthField('Last name'),
    }),
    email: new FormControl(this.initial?.email ?? '', {
      nonNullable: true,
      validators: emailValidator,
    }),
    confirmEmail: new FormControl(this.initial?.confirmEmail ?? '', {
      nonNullable: true,
      validators: confirmEmailValidator,
    }),
    phone: new FormControl(this.initial?.phone ?? '', {
      nonNullable: true,
      validators: phoneValidator,
    }),
    terms: new FormControl(this.initial?.terms ?? false, {
      nonNullable: true,
      validators: termsValidator,
    }),
  });

  protected readonly processing = signal(false);
  protected readonly payLabel = computed(() =>
    this.processing() ? 'Processing…' : `Pay ${formatPrice(this.booking.total())}`,
  );

  constructor() {
    const { email, confirmEmail } = this.form.controls;
    confirmEmail.updateValueAndValidity();
    email.valueChanges.subscribe(() => confirmEmail.updateValueAndValidity());
    this.form.valueChanges.subscribe(() => this.booking.setForm(this.form.getRawValue()));
  }

  protected error(control: AbstractControl): string | null {
    return control.touched && control.errors ? (control.errors['message'] as string) : null;
  }

  protected termsToggled(): void {
    this.form.controls.terms.markAsTouched();
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.booking.booking()?.screeningId, 'summary']);
  }

  protected pay(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const booking = this.booking.booking();
    if (!booking) return;
    const values: BookingForm = this.form.getRawValue();
    this.processing.set(true);
    this.api
      .createReservation({
        screeningId: booking.screeningId,
        seats: this.booking.tickets().flatMap((ticket) => ticket.ids),
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
        totalPrice: this.booking.total(),
      })
      .subscribe({
        next: () => {
          this.booking.markPaid(values.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.processing.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

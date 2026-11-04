import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/api.service';
import { BookingService, EMPTY_FORM } from '../../core/booking.service';
import { FormValues } from '../../core/models';
import { formatPrice, itemsToSeatIds } from '../../core/seats';
import { ToastService } from '../../core/toast.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9]{9}$/;

type Field = keyof FormValues;

function required(label: string) {
  return (c: AbstractControl): ValidationErrors | null =>
    c.value === '' ? { message: `${label} is required` } : null;
}

function minLength(label: string) {
  return (c: AbstractControl): ValidationErrors | null =>
    (c.value as string).length < 2 ? { message: `${label} must be at least 2 characters` } : null;
}

function chain(...validators: ((c: AbstractControl) => ValidationErrors | null)[]) {
  return (c: AbstractControl): ValidationErrors | null => {
    for (const v of validators) {
      const result = v(c);
      if (result) return result;
    }
    return null;
  };
}

@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly form: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    confirmEmail: FormControl<string>;
    phone: FormControl<string>;
    terms: FormControl<boolean>;
  }>;

  protected readonly submitting = signal(false);
  protected readonly payLabel = computed(() =>
    this.submitting() ? 'Processing…' : `Pay ${formatPrice(this.booking.total())}`,
  );

  constructor() {
    const saved = this.booking.booking()?.form ?? EMPTY_FORM;
    const nonNull = { nonNullable: true } as const;
    const email = new FormControl(saved.email, {
      ...nonNull,
      validators: chain(required('Email'), (c) =>
        EMAIL_RE.test(c.value) ? null : { message: 'Enter a valid email address' },
      ),
    });
    const confirmEmail = new FormControl(saved.confirmEmail, {
      ...nonNull,
      validators: chain(required('Confirm email'), (c) =>
        c.value === email.value ? null : { message: 'Email addresses do not match' },
      ),
    });
    this.form = new FormGroup({
      firstName: new FormControl(saved.firstName, {
        ...nonNull,
        validators: chain(required('First name'), minLength('First name')),
      }),
      lastName: new FormControl(saved.lastName, {
        ...nonNull,
        validators: chain(required('Last name'), minLength('Last name')),
      }),
      email,
      confirmEmail,
      phone: new FormControl(saved.phone, {
        ...nonNull,
        validators: (c) =>
          c.value === '' || PHONE_RE.test(c.value)
            ? null
            : { message: 'Phone number must be exactly 9 digits' },
      }),
      terms: new FormControl(saved.terms, {
        ...nonNull,
        validators: (c) =>
          c.value ? null : { message: 'You must accept the terms and conditions' },
      }),
    });

    email.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => confirmEmail.updateValueAndValidity());
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.booking.setForm(this.form.getRawValue()));
  }

  protected error(field: Field): string | null {
    const c = this.form.controls[field];
    return c.touched ? ((c.errors?.['message'] as string | undefined) ?? null) : null;
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'summary']);
  }

  protected pay(): void {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('The form contains errors');
      return;
    }
    const b = this.booking.booking();
    if (!b) return;
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.api
      .createReservation({
        screeningId: b.screeningId,
        seats: itemsToSeatIds(b.items),
        customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
        totalPrice: this.booking.total(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.booking.markPaid(v.email);
          this.router.navigateByUrl('/confirmation');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('Payment failed. Please try again.');
        },
      });
  }
}

import { inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/** The values typed into the checkout form. */
export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

/**
 * The booking in progress: the screening, the identifiers of the selected seats (a couch has two),
 * the checkout values, and the customer's email once the booking is paid.
 */
export interface Booking {
  screeningId: number;
  seats: string[];
  checkout: CheckoutValues;
  paidEmail?: string;
}

export const EMPTY_CHECKOUT: CheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

const STORAGE_KEY = 'cinescope.booking';

/** Holds the booking in progress and keeps it in `sessionStorage`, so it survives a reload. */
@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly current = signal<Booking | null>(readStoredBooking());

  readonly booking = this.current.asReadonly();

  /** Starts an empty booking for the screening, unless a booking in progress already belongs to it. */
  openFor(screeningId: number): void {
    const booking = this.current();
    if (booking === null || booking.screeningId !== screeningId || booking.paidEmail !== undefined) {
      this.save({ screeningId, seats: [], checkout: EMPTY_CHECKOUT });
    }
  }

  setSeats(seats: string[]): void {
    this.update({ seats });
  }

  setCheckout(checkout: CheckoutValues): void {
    this.update({ checkout });
  }

  /** Marks the booking in progress as paid, keeping the customer's email for the confirmation. */
  markPaid(email: string): void {
    this.update({ paidEmail: email });
  }

  clear(): void {
    this.current.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private update(changes: Partial<Booking>): void {
    const booking = this.current();
    if (booking !== null) {
      this.save({ ...booking, ...changes });
    }
  }

  private save(booking: Booking): void {
    this.current.set(booking);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }
}

/**
 * Lets a route with an `id` parameter be entered only with an unpaid booking in progress for that
 * screening that has at least one seat; otherwise redirects to the movie list.
 */
export const bookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingStore).booking();
  const screeningId = Number(route.paramMap.get('id'));
  const allowed =
    booking !== null &&
    booking.paidEmail === undefined &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0;
  return allowed ? true : inject(Router).createUrlTree(['/']);
};

/** Lets the confirmation be entered only with a paid booking; otherwise redirects to the movie list. */
export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingStore).booking();
  return booking?.paidEmail !== undefined ? true : inject(Router).createUrlTree(['/']);
};

function readStoredBooking(): Booking | null {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    return isBooking(stored) ? stored : null;
  } catch {
    return null;
  }
}

function isBooking(value: unknown): value is Booking {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { screeningId, seats, checkout, paidEmail } = value as Partial<Record<keyof Booking, unknown>>;
  return (
    typeof screeningId === 'number' &&
    Array.isArray(seats) &&
    seats.every((id) => typeof id === 'string') &&
    isCheckoutValues(checkout) &&
    (paidEmail === undefined || typeof paidEmail === 'string')
  );
}

function isCheckoutValues(value: unknown): value is CheckoutValues {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const values = value as Record<keyof CheckoutValues, unknown>;
  return (
    typeof values.firstName === 'string' &&
    typeof values.lastName === 'string' &&
    typeof values.email === 'string' &&
    typeof values.confirmEmail === 'string' &&
    typeof values.phone === 'string' &&
    typeof values.terms === 'boolean'
  );
}

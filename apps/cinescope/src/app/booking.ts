import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/** The values typed into the checkout form; kept as they are typed. */
export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

/** The booking: one screening, the seats selected for it and, once paid, the payer's email. */
export interface Booking {
  screeningId: number;
  /** Seat identifiers (`R<row>C<column>`); a couch contributes both of its identifiers. */
  seats: string[];
  /** The checkout form values, when the customer has typed any. */
  checkout?: CheckoutValues;
  /** Set once the booking is paid; a paid booking is no longer in progress. */
  paidEmail?: string;
}

const STORAGE_KEY = 'cinescope.booking';

function isCheckoutValues(value: unknown): value is CheckoutValues {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const checkout = value as Record<keyof CheckoutValues, unknown>;
  return (
    typeof checkout.firstName === 'string' &&
    typeof checkout.lastName === 'string' &&
    typeof checkout.email === 'string' &&
    typeof checkout.confirmEmail === 'string' &&
    typeof checkout.phone === 'string' &&
    typeof checkout.terms === 'boolean'
  );
}

function parseBooking(raw: string | null): Booking | null {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<Booking>;
    if (typeof value.screeningId !== 'number' || !Array.isArray(value.seats)) {
      return null;
    }
    const seats = value.seats;
    if (!seats.every((seat) => typeof seat === 'string')) {
      return null;
    }
    const booking: Booking = { screeningId: value.screeningId, seats };
    if (isCheckoutValues(value.checkout)) {
      booking.checkout = value.checkout;
    }
    if (typeof value.paidEmail === 'string') {
      booking.paidEmail = value.paidEmail;
    }
    return booking;
  } catch {
    return null;
  }
}

/** Keeps the booking in `sessionStorage`, so it survives a reload. */
@Injectable({ providedIn: 'root' })
export class BookingService {
  /** The stored booking, or null when there is none. */
  current(): Booking | null {
    return parseBooking(sessionStorage.getItem(STORAGE_KEY));
  }

  save(booking: Booking): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Lets the summary and checkout screens open only for an unpaid booking of the screening in the
 * route with at least one seat; otherwise redirects to `/`.
 */
export const bookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).current();
  const allowed =
    booking !== null &&
    String(booking.screeningId) === route.paramMap.get('id') &&
    booking.seats.length > 0 &&
    booking.paidEmail === undefined;
  return allowed ? true : inject(Router).createUrlTree(['/']);
};

/** Lets the confirmation screen open only for a paid booking; otherwise redirects to `/`. */
export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).current();
  return booking?.paidEmail !== undefined ? true : inject(Router).createUrlTree(['/']);
};

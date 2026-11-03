import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const STORAGE_KEY = 'cinescope.booking';

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export interface Booking {
  screeningId: number;
  seats: string[];
  checkout?: CheckoutForm;
  paidEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  current(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  }

  startOrResume(screeningId: number): Booking {
    const existing = this.current();
    return existing?.screeningId === screeningId && !existing.paidEmail
      ? existing
      : this.save({ screeningId, seats: [] });
  }

  save(booking: Booking): Booking {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    return booking;
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export const bookingInProgress: CanActivateFn = (route) => {
  const booking = inject(BookingService).current();
  const screeningId = Number(route.paramMap.get('id'));
  if (booking?.screeningId === screeningId && booking.seats.length > 0 && !booking.paidEmail) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};

export const bookingPaid: CanActivateFn = () =>
  inject(BookingService).current()?.paidEmail ? true : inject(Router).createUrlTree(['/']);

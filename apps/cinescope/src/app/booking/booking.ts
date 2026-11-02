import { inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const MAX_SEATS = 10;

export interface CustomerForm {
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
  form: CustomerForm;
  paidEmail: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

export const EMPTY_FORM: CustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function emptyBooking(screeningId: number): Booking {
  return { screeningId, seats: [], form: { ...EMPTY_FORM }, paidEmail: null };
}

function readStoredBooking(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(readStoredBooking());

  readonly booking = this.state.asReadonly();

  startFor(screeningId: number): void {
    const current = this.state();
    if (current && current.screeningId === screeningId && current.paidEmail === null) {
      return;
    }
    this.save(emptyBooking(screeningId));
  }

  setSeats(seats: string[]): void {
    this.update((booking) => ({ ...booking, seats }));
  }

  setForm(form: CustomerForm): void {
    this.update((booking) => ({ ...booking, form }));
  }

  markPaid(email: string): void {
    this.update((booking) => ({ ...booking, paidEmail: email }));
  }

  clear(): void {
    this.state.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private update(change: (booking: Booking) => Booking): void {
    const current = this.state();
    if (current) {
      this.save(change(current));
    }
  }

  private save(booking: Booking): void {
    this.state.set(booking);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }
}

export const inProgressBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const screeningId = Number(route.paramMap.get('id'));
  const valid =
    booking !== null &&
    booking.paidEmail === null &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0;
  return valid || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  return booking?.paidEmail != null || inject(Router).createUrlTree(['/']);
};

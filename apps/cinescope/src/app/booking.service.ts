import { Injectable, signal } from '@angular/core';
import { Booking, CheckoutValues } from './models';

const STORAGE_KEY = 'cinescope.booking';

const EMPTY_CHECKOUT: CheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function loadBooking(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Booking) : null;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  readonly booking = signal<Booking | null>(loadBooking());

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], checkout: { ...EMPTY_CHECKOUT }, paidEmail: null });
  }

  update(patch: Partial<Booking>): void {
    const current = this.booking();
    if (current) {
      this.set({ ...current, ...patch });
    }
  }

  clear(): void {
    this.set(null);
  }

  private set(booking: Booking | null): void {
    this.booking.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

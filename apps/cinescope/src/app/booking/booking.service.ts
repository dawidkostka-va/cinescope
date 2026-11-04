import { Injectable, signal } from '@angular/core';
import { CheckoutValues } from '../models';

export interface Booking {
  screeningId: number;
  seats: string[];
  checkout: CheckoutValues;
  paidEmail: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

export const EMPTY_CHECKOUT: CheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(readStored());
  readonly booking = this.state.asReadonly();

  openSeatMap(screeningId: number): void {
    const current = this.state();
    if (current?.screeningId === screeningId && current.paidEmail === null) {
      return;
    }
    this.update({ screeningId, seats: [], checkout: EMPTY_CHECKOUT, paidEmail: null });
  }

  setSeats(seats: string[]): void {
    const current = this.state();
    if (current) {
      this.update({ ...current, seats });
    }
  }

  setCheckout(checkout: CheckoutValues): void {
    const current = this.state();
    if (current) {
      this.update({ ...current, checkout });
    }
  }

  markPaid(email: string): void {
    const current = this.state();
    if (current) {
      this.update({ ...current, paidEmail: email });
    }
  }

  clear(): void {
    this.update(null);
  }

  private update(booking: Booking | null): void {
    this.state.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

function readStored(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Booking) : null;
}

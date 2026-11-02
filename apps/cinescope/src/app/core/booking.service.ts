import { Injectable, signal } from '@angular/core';

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
  form: CheckoutForm;
  paid: boolean;
  email?: string;
}

export const EMPTY_FORM: CheckoutForm = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null'));
  readonly booking = this.state.asReadonly();

  set(booking: Booking | null): void {
    this.state.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  update(change: (booking: Booking) => Booking): void {
    const current = this.state();
    if (current) {
      this.set(change(current));
    }
  }

  startNew(screeningId: number): void {
    this.set({ screeningId, seats: [], form: EMPTY_FORM, paid: false });
  }
}

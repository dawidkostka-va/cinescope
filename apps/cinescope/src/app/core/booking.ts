import { Injectable, signal } from '@angular/core';

export interface CheckoutValues {
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
  form: CheckoutValues;
  paidEmail: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

const EMPTY_FORM: CheckoutValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function readStoredBooking(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Booking) : null;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly current = signal<Booking | null>(readStoredBooking());

  readonly booking = this.current.asReadonly();

  start(screeningId: number): void {
    this.save({ screeningId, seats: [], form: { ...EMPTY_FORM }, paidEmail: null });
  }

  setSeats(seats: string[]): void {
    this.patch({ seats });
  }

  setForm(form: CheckoutValues): void {
    this.patch({ form });
  }

  markPaid(email: string): void {
    this.patch({ paidEmail: email });
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.current.set(null);
  }

  private patch(changes: Partial<Booking>): void {
    const booking = this.current();
    if (booking) {
      this.save({ ...booking, ...changes });
    }
  }

  private save(booking: Booking): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    this.current.set(booking);
  }
}

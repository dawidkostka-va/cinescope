import { Injectable, signal } from '@angular/core';

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
  paidEmail: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

export function emptyCheckoutForm(): CheckoutForm {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  readonly booking = signal<Booking | null>(this.restore());

  open(screeningId: number): void {
    const current = this.booking();
    if (current && current.screeningId === screeningId && current.paidEmail === null) {
      return;
    }
    this.save({ screeningId, seats: [], form: emptyCheckoutForm(), paidEmail: null });
  }

  setSeats(seats: string[]): void {
    this.patch({ seats });
  }

  setForm(form: CheckoutForm): void {
    this.patch({ form });
  }

  markPaid(email: string): void {
    this.patch({ paidEmail: email });
  }

  clear(): void {
    this.booking.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private patch(changes: Partial<Booking>): void {
    const current = this.booking();
    if (current) {
      this.save({ ...current, ...changes });
    }
  }

  private save(booking: Booking): void {
    this.booking.set(booking);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }

  private restore(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  }
}

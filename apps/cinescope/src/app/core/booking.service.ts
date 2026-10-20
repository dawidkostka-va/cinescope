import { Injectable, signal } from '@angular/core';
import { Booking, CheckoutFormValues, emptyCheckoutForm } from './models';

const STORAGE_KEY = 'cinescope:booking';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly bookingSignal = signal<Booking | null>(this.load());
  readonly booking = this.bookingSignal.asReadonly();

  private load(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Booking;
    } catch {
      return null;
    }
  }

  private persist(booking: Booking | null): void {
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    this.bookingSignal.set(booking);
  }

  snapshot(): Booking | null {
    return this.bookingSignal();
  }

  /** Reuses the booking in progress for this screening, or starts a fresh, empty one. */
  getOrCreateForScreening(screeningId: number): Booking {
    const current = this.bookingSignal();
    if (current && !current.paid && current.screeningId === screeningId) {
      return current;
    }
    const fresh: Booking = {
      screeningId,
      seats: [],
      paid: false,
      customerEmail: null,
      form: emptyCheckoutForm(),
    };
    this.persist(fresh);
    return fresh;
  }

  addSeats(ids: string[]): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    const seats = [...booking.seats, ...ids.filter((id) => !booking.seats.includes(id))];
    this.persist({ ...booking, seats });
  }

  removeSeats(ids: string[]): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    const seats = booking.seats.filter((id) => !ids.includes(id));
    this.persist({ ...booking, seats });
  }

  updateForm(partial: Partial<CheckoutFormValues>): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    this.persist({ ...booking, form: { ...booking.form, ...partial } });
  }

  markPaid(email: string): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    this.persist({ ...booking, paid: true, customerEmail: email });
  }

  clear(): void {
    this.persist(null);
  }
}

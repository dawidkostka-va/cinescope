import { Injectable, signal } from '@angular/core';
import { Booking, CheckoutFormValues, emptyCheckoutForm } from './models';

const STORAGE_KEY = 'cinescope-booking';

export type ToggleResult = 'added' | 'removed' | 'limit';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly _booking = signal<Booking | null>(this.readFromStorage());
  readonly booking = this._booking.asReadonly();

  private readFromStorage(): Booking | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Booking) : null;
    } catch {
      return null;
    }
  }

  private persist(booking: Booking | null): void {
    this._booking.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  ensureBooking(screeningId: number): Booking {
    const current = this._booking();
    if (current && !current.paid && current.screeningId === screeningId) {
      return current;
    }
    const fresh: Booking = { screeningId, seats: [], form: emptyCheckoutForm(), paid: false };
    this.persist(fresh);
    return fresh;
  }

  toggleSeat(ids: string[]): ToggleResult {
    const current = this._booking();
    if (!current) {
      return 'limit';
    }
    const allSelected = ids.every((id) => current.seats.includes(id));
    if (allSelected) {
      this.persist({ ...current, seats: current.seats.filter((id) => !ids.includes(id)) });
      return 'removed';
    }
    if (current.seats.length + ids.length > 10) {
      return 'limit';
    }
    this.persist({ ...current, seats: [...current.seats, ...ids] });
    return 'added';
  }

  removeSeats(ids: string[]): void {
    const current = this._booking();
    if (!current) {
      return;
    }
    this.persist({ ...current, seats: current.seats.filter((id) => !ids.includes(id)) });
  }

  updateForm(partial: Partial<CheckoutFormValues>): void {
    const current = this._booking();
    if (!current) {
      return;
    }
    this.persist({ ...current, form: { ...current.form, ...partial } });
  }

  markPaid(email: string): void {
    const current = this._booking();
    if (!current) {
      return;
    }
    this.persist({ ...current, paid: true, email });
  }

  clear(): void {
    this.persist(null);
  }
}

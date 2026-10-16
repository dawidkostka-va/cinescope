import { Injectable, signal } from '@angular/core';
import { Booking, CheckoutFormValues, emptyForm } from './booking.model';

const STORAGE_KEY = 'cinescope.booking';

export type ToggleResult = 'added' | 'removed' | 'limit';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly _booking = signal<Booking | null>(readFromStorage());

  readonly booking = this._booking.asReadonly();

  /**
   * Shows the booking in progress for this screening, or starts a new, empty
   * one, discarding whatever was there before.
   */
  ensureBookingFor(screeningId: number): void {
    const current = this._booking();
    if (current && !current.paid && current.screeningId === screeningId) {
      return;
    }
    this.persist({ screeningId, seats: [], form: emptyForm(), paid: false, customerEmail: null });
  }

  isActiveFor(screeningId: number): boolean {
    const booking = this._booking();
    return !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;
  }

  isPaid(): boolean {
    return this._booking()?.paid ?? false;
  }

  toggleSeats(ids: string[]): ToggleResult {
    const current = this._booking();
    if (!current) {
      return 'removed';
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

  updateForm(values: CheckoutFormValues): void {
    const current = this._booking();
    if (!current) {
      return;
    }
    this.persist({ ...current, form: values });
  }

  markPaid(email: string): void {
    const current = this._booking();
    if (!current) {
      return;
    }
    this.persist({ ...current, paid: true, customerEmail: email });
  }

  clear(): void {
    this.persist(null);
  }

  private persist(booking: Booking | null): void {
    this._booking.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

function readFromStorage(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
}

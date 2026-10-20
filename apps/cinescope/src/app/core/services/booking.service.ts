import { Injectable, signal } from '@angular/core';
import { Booking, BookingForm, emptyBooking } from '../models/booking.model';
import { MAX_SEATS_PER_BOOKING } from '../utils/seat.util';

const STORAGE_KEY = 'cinescope.booking';

export type ToggleResult = 'added' | 'removed' | 'limit';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly _booking = signal<Booking | null>(loadFromStorage());
  readonly booking = this._booking.asReadonly();

  private persist(booking: Booking | null): void {
    this._booking.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Keeps the in-progress booking when it already belongs to this screening and is unpaid;
   * otherwise starts a fresh, empty booking for it.
   */
  ensureForScreening(screeningId: number): void {
    const current = this._booking();
    if (!current || current.paid || current.screeningId !== screeningId) {
      this.persist(emptyBooking(screeningId));
    }
  }

  isActiveFor(screeningId: number): boolean {
    const booking = this._booking();
    return !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;
  }

  isPaid(): boolean {
    return this._booking()?.paid ?? false;
  }

  /** Toggles a seat (or both identifiers of a couch) as one unit. */
  toggleSeats(identifiers: string[]): ToggleResult {
    const booking = this._booking();
    if (!booking) return 'removed';

    const allSelected = identifiers.every((id) => booking.seats.includes(id));
    if (allSelected) {
      this.persist({ ...booking, seats: booking.seats.filter((s) => !identifiers.includes(s)) });
      return 'removed';
    }

    if (booking.seats.length + identifiers.length > MAX_SEATS_PER_BOOKING) {
      return 'limit';
    }

    this.persist({ ...booking, seats: [...booking.seats, ...identifiers] });
    return 'added';
  }

  removeSeats(identifiers: string[]): void {
    const booking = this._booking();
    if (!booking) return;
    this.persist({ ...booking, seats: booking.seats.filter((s) => !identifiers.includes(s)) });
  }

  updateForm(partial: Partial<BookingForm>): void {
    const booking = this._booking();
    if (!booking) return;
    this.persist({ ...booking, form: { ...booking.form, ...partial } });
  }

  markPaid(email: string): void {
    const booking = this._booking();
    if (!booking) return;
    this.persist({ ...booking, paid: true, customerEmail: email });
  }

  clear(): void {
    this.persist(null);
  }
}

function loadFromStorage(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

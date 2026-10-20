import { Injectable, signal } from '@angular/core';
import { BookingState, CheckoutFormValues, emptyBooking } from '../models/booking.model';

const STORAGE_KEY = 'cinescope-booking';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<BookingState | null>(this.load());
  readonly booking = this.state.asReadonly();

  private load(): BookingState | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as BookingState;
    } catch {
      return null;
    }
  }

  private persist(value: BookingState | null): void {
    this.state.set(value);
    if (value) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  /** Keeps the current booking when it is unpaid and belongs to this screening; otherwise starts a new, empty one. */
  ensureBookingForScreening(screeningId: number): void {
    const current = this.state();
    if (current && !current.paid && current.screeningId === screeningId) {
      return;
    }
    this.persist(emptyBooking(screeningId));
  }

  hasActiveBookingFor(screeningId: number): boolean {
    const current = this.state();
    return !!current && !current.paid && current.screeningId === screeningId && current.seats.length > 0;
  }

  hasPaidBooking(): boolean {
    return !!this.state()?.paid;
  }

  isSeatSelected(id: string): boolean {
    return this.state()?.seats.includes(id) ?? false;
  }

  seatCount(): number {
    return this.state()?.seats.length ?? 0;
  }

  /** Toggles a seat or couch (1 or 2 identifiers). Returns false when selecting would exceed the 10-seat cap. */
  toggleUnit(ids: string[]): boolean {
    const current = this.state();
    if (!current) {
      return false;
    }
    const selected = current.seats.includes(ids[0]);
    if (selected) {
      this.persist({ ...current, seats: current.seats.filter((id) => !ids.includes(id)) });
      return true;
    }
    if (current.seats.length + ids.length > 10) {
      return false;
    }
    this.persist({ ...current, seats: [...current.seats, ...ids] });
    return true;
  }

  removeUnit(ids: string[]): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.persist({ ...current, seats: current.seats.filter((id) => !ids.includes(id)) });
  }

  updateForm(partial: Partial<CheckoutFormValues>): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.persist({ ...current, form: { ...current.form, ...partial } });
  }

  markPaid(email: string): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.persist({ ...current, paid: true, customerEmail: email });
  }

  clear(): void {
    this.persist(null);
  }
}

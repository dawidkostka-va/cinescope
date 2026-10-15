import { Injectable, signal } from '@angular/core';
import { Booking, CheckoutFormValues, createBooking } from '../models/booking.model';

const STORAGE_KEY = 'cinescope:booking';

export type ToggleResult = 'selected' | 'deselected' | 'limit';

const MAX_SEATS = 10;

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(readFromStorage());
  readonly booking = this.state.asReadonly();

  startNewBooking(screeningId: number): void {
    this.persist(createBooking(screeningId));
  }

  ensureBookingForScreening(screeningId: number): void {
    const current = this.state();
    if (!current || current.paid || current.screeningId !== screeningId) {
      this.startNewBooking(screeningId);
    }
  }

  clearBooking(): void {
    this.persist(null);
  }

  toggleSeats(ids: string[]): ToggleResult {
    const current = this.state();
    if (!current) {
      return 'limit';
    }
    const allSelected = ids.every((id) => current.seats.includes(id));
    if (allSelected) {
      this.persist({ ...current, seats: current.seats.filter((id) => !ids.includes(id)) });
      return 'deselected';
    }
    if (current.seats.length + ids.length > MAX_SEATS) {
      return 'limit';
    }
    this.persist({ ...current, seats: [...current.seats, ...ids] });
    return 'selected';
  }

  removeSeats(ids: string[]): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.persist({ ...current, seats: current.seats.filter((id) => !ids.includes(id)) });
  }

  updateForm(form: CheckoutFormValues): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.persist({ ...current, form });
  }

  markPaid(email: string): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.persist({ ...current, paid: true, email });
  }

  private persist(booking: Booking | null): void {
    this.state.set(booking);
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

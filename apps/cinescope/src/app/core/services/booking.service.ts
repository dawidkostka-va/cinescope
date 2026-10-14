import { Injectable, computed, signal } from '@angular/core';
import { Booking, BookingFormValues, newBooking } from '../models/booking.model';
import { MAX_SEATS_PER_BOOKING } from '../models/seat.model';

const STORAGE_KEY = 'cinescope-booking';

function readFromStorage(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly bookingSignal = signal<Booking | null>(readFromStorage());

  readonly booking = this.bookingSignal.asReadonly();
  readonly seats = computed(() => this.bookingSignal()?.seats ?? []);

  private persist(booking: Booking | null): void {
    this.bookingSignal.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  /** True when there is an unpaid booking for this screening with at least one seat. */
  isInProgressFor(screeningId: number): boolean {
    const booking = this.bookingSignal();
    return !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;
  }

  isPaid(): boolean {
    return !!this.bookingSignal()?.paid;
  }

  /** Starts a fresh booking for this screening unless one is already in progress for it. */
  ensureBookingFor(screeningId: number): void {
    const booking = this.bookingSignal();
    const belongsHere = !!booking && !booking.paid && booking.screeningId === screeningId;
    if (!belongsHere) {
      this.persist(newBooking(screeningId));
    }
  }

  canSelect(ids: string[]): boolean {
    const booking = this.bookingSignal();
    if (!booking) return false;
    return booking.seats.length + ids.length <= MAX_SEATS_PER_BOOKING;
  }

  isSelected(id: string): boolean {
    return this.bookingSignal()?.seats.includes(id) ?? false;
  }

  select(ids: string[]): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    this.persist({ ...booking, seats: [...booking.seats, ...ids] });
  }

  deselect(ids: string[]): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    const toRemove = new Set(ids);
    this.persist({ ...booking, seats: booking.seats.filter((id) => !toRemove.has(id)) });
  }

  updateForm(values: BookingFormValues): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    this.persist({ ...booking, form: values });
  }

  markPaid(email: string): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    this.persist({ ...booking, paid: true, email });
  }

  clear(): void {
    this.persist(null);
  }
}

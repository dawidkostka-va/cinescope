import { Injectable, effect, signal } from '@angular/core';
import { Booking, CheckoutFormValues } from './models';

const STORAGE_KEY = 'cinescope.booking';

function emptyForm(): CheckoutFormValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', termsAccepted: false };
}

function emptyBooking(screeningId: number): Booking {
  return { screeningId, seats: [], form: emptyForm(), paid: false, email: null };
}

export type ToggleResult = 'added' | 'removed' | 'limit-exceeded';

const MAX_SEATS = 10;

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly bookingSignal = signal<Booking | null>(readStorage());
  readonly booking = this.bookingSignal.asReadonly();

  constructor() {
    effect(() => {
      const booking = this.bookingSignal();
      if (booking) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    });
  }

  ensureBookingForScreening(screeningId: number): void {
    const current = this.bookingSignal();
    if (!current || current.paid || current.screeningId !== screeningId) {
      this.bookingSignal.set(emptyBooking(screeningId));
    }
  }

  hasUnpaidSeatsFor(screeningId: number): boolean {
    const booking = this.bookingSignal();
    return !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;
  }

  hasPaidBooking(): boolean {
    return !!this.bookingSignal()?.paid;
  }

  toggleSeats(ids: string[]): ToggleResult {
    const booking = this.bookingSignal();
    if (!booking) return 'removed';

    const set = new Set(booking.seats);
    const allSelected = ids.every((id) => set.has(id));

    if (allSelected) {
      ids.forEach((id) => set.delete(id));
      this.bookingSignal.set({ ...booking, seats: [...set] });
      return 'removed';
    }

    if (set.size + ids.length > MAX_SEATS) {
      return 'limit-exceeded';
    }

    ids.forEach((id) => set.add(id));
    this.bookingSignal.set({ ...booking, seats: [...set] });
    return 'added';
  }

  removeSeats(ids: string[]): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    const set = new Set(booking.seats);
    ids.forEach((id) => set.delete(id));
    this.bookingSignal.set({ ...booking, seats: [...set] });
  }

  updateForm(patch: Partial<CheckoutFormValues>): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    this.bookingSignal.set({ ...booking, form: { ...booking.form, ...patch } });
  }

  markPaid(email: string): void {
    const booking = this.bookingSignal();
    if (!booking) return;
    this.bookingSignal.set({ ...booking, paid: true, email });
  }

  clear(): void {
    this.bookingSignal.set(null);
  }
}

function readStorage(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
}

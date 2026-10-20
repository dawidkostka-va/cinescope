import { Injectable, signal } from '@angular/core';

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  termsAccepted: boolean;
}

export interface Booking {
  screeningId: number;
  seats: string[];
  form: CheckoutForm;
  paid: boolean;
  customerEmail: string | null;
}

const STORAGE_KEY = 'cinescope-booking';

function emptyForm(): CheckoutForm {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', termsAccepted: false };
}

function emptyBooking(screeningId: number): Booking {
  return { screeningId, seats: [], form: emptyForm(), paid: false, customerEmail: null };
}

export type ToggleResult = 'selected' | 'deselected' | 'limit';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly _booking = signal<Booking | null>(readStorage());
  readonly booking = this._booking.asReadonly();

  private persist(booking: Booking | null): void {
    this._booking.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  ensureBookingForScreening(screeningId: number): void {
    const current = this._booking();
    if (!current || current.paid || current.screeningId !== screeningId) {
      this.persist(emptyBooking(screeningId));
    }
  }

  toggleIds(ids: string[], maxSeats: number): ToggleResult {
    const current = this._booking();
    if (!current) return 'limit';
    const seats = new Set(current.seats);
    const allSelected = ids.every((id) => seats.has(id));
    if (allSelected) {
      ids.forEach((id) => seats.delete(id));
      this.persist({ ...current, seats: Array.from(seats) });
      return 'deselected';
    }
    if (current.seats.length + ids.length > maxSeats) {
      return 'limit';
    }
    ids.forEach((id) => seats.add(id));
    this.persist({ ...current, seats: Array.from(seats) });
    return 'selected';
  }

  removeIds(ids: string[]): void {
    const current = this._booking();
    if (!current) return;
    const seats = new Set(current.seats);
    ids.forEach((id) => seats.delete(id));
    this.persist({ ...current, seats: Array.from(seats) });
  }

  updateForm(partial: Partial<CheckoutForm>): void {
    const current = this._booking();
    if (!current) return;
    this.persist({ ...current, form: { ...current.form, ...partial } });
  }

  markPaid(email: string): void {
    const current = this._booking();
    if (!current) return;
    this.persist({ ...current, paid: true, customerEmail: email });
  }

  clear(): void {
    this.persist(null);
  }
}

function readStorage(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

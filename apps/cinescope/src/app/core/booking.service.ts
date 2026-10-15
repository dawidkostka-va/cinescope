import { Injectable, computed, signal } from '@angular/core';

export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  termsAccepted: boolean;
}

export interface BookingState {
  screeningId: number;
  seats: string[];
  form: CheckoutFormValues;
  paid: boolean;
  email: string | null;
}

const STORAGE_KEY = 'cinescope-booking';

function emptyForm(): CheckoutFormValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', termsAccepted: false };
}

function emptyBooking(screeningId: number): BookingState {
  return { screeningId, seats: [], form: emptyForm(), paid: false, email: null };
}

function readFromStorage(): BookingState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BookingState) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<BookingState | null>(readFromStorage());

  readonly booking = computed(() => this.state());

  private persist(next: BookingState | null): void {
    this.state.set(next);
    if (next) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  /** Reuses the in-progress booking for this screening, otherwise starts a fresh one. */
  ensureBookingForScreening(screeningId: number): void {
    const current = this.state();
    if (current && !current.paid && current.screeningId === screeningId) {
      return;
    }
    this.persist(emptyBooking(screeningId));
  }

  setSeats(seats: string[]): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.persist({ ...current, seats });
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
    this.persist({ ...current, paid: true, email });
  }

  clear(): void {
    this.persist(null);
  }
}

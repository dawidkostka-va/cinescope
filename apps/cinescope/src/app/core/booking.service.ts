import { Injectable, signal } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<BookingState | null>(this.load());

  readonly booking = this.state.asReadonly();

  private load(): BookingState | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BookingState) : null;
    } catch {
      return null;
    }
  }

  private persist(next: BookingState | null): void {
    this.state.set(next);
    if (next) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  /** Starts a fresh, empty booking for this screening unless one for it is already in progress. */
  ensureBookingFor(screeningId: number): void {
    const current = this.state();
    if (current && current.screeningId === screeningId && !current.paid) return;
    this.persist({ screeningId, seats: [], form: emptyForm(), paid: false, email: null });
  }

  belongsToUnpaid(screeningId: number): boolean {
    const current = this.state();
    return !!current && !current.paid && current.screeningId === screeningId;
  }

  isPaid(): boolean {
    return !!this.state()?.paid;
  }

  setSeats(seats: string[]): void {
    const current = this.state();
    if (!current) return;
    this.persist({ ...current, seats });
  }

  updateForm(partial: Partial<CheckoutFormValues>): void {
    const current = this.state();
    if (!current) return;
    this.persist({ ...current, form: { ...current.form, ...partial } });
  }

  markPaid(email: string): void {
    const current = this.state();
    if (!current) return;
    this.persist({ ...current, paid: true, email });
  }

  clear(): void {
    this.persist(null);
  }
}

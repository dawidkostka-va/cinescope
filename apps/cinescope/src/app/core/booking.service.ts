import { Injectable, signal } from '@angular/core';

export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export interface BookingState {
  screeningId: number;
  seats: string[];
  form: CheckoutFormValues;
  paid: boolean;
  email: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

const EMPTY_FORM: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function loadInitial(): BookingState | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingState;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<BookingState | null>(loadInitial());

  readonly booking = this.state.asReadonly();

  private persist(next: BookingState | null): void {
    this.state.set(next);
    if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(STORAGE_KEY);
  }

  matchesUnpaid(screeningId: number): boolean {
    const booking = this.state();
    return !!booking && !booking.paid && booking.screeningId === screeningId;
  }

  hasSeats(): boolean {
    return (this.state()?.seats.length ?? 0) > 0;
  }

  isPaid(): boolean {
    return this.state()?.paid ?? false;
  }

  selectedSeats(): string[] {
    return this.state()?.seats ?? [];
  }

  seatCount(): number {
    return this.state()?.seats.length ?? 0;
  }

  /** Starts a fresh booking for this screening unless one already in progress belongs to it. */
  ensureBooking(screeningId: number): void {
    const booking = this.state();
    if (!booking || booking.paid || booking.screeningId !== screeningId) {
      this.persist({ screeningId, seats: [], form: { ...EMPTY_FORM }, paid: false, email: null });
    }
  }

  clear(): void {
    this.persist(null);
  }

  addSeats(ids: string[]): void {
    const booking = this.state();
    if (!booking) return;
    this.persist({ ...booking, seats: [...booking.seats, ...ids] });
  }

  removeSeats(ids: string[]): void {
    const booking = this.state();
    if (!booking) return;
    const toRemove = new Set(ids);
    this.persist({ ...booking, seats: booking.seats.filter((id) => !toRemove.has(id)) });
  }

  updateForm(partial: Partial<CheckoutFormValues>): void {
    const booking = this.state();
    if (!booking) return;
    this.persist({ ...booking, form: { ...booking.form, ...partial } });
  }

  markPaid(email: string): void {
    const booking = this.state();
    if (!booking) return;
    this.persist({ ...booking, paid: true, email });
  }
}

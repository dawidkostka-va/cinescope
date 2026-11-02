import { Injectable, computed, signal } from '@angular/core';
import { Booking, BookingForm } from './models';
import { ticketsFromSeats } from './seats';

const STORAGE_KEY = 'cinescope.booking';

export const EMPTY_FORM: BookingForm = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function load(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.screeningId !== 'number' || !Array.isArray(data.seats)) return null;
    return {
      screeningId: data.screeningId,
      seats: data.seats.filter((s: unknown): s is string => typeof s === 'string'),
      form: { ...EMPTY_FORM, ...data.form },
      paidEmail: typeof data.paidEmail === 'string' ? data.paidEmail : null,
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(load());

  readonly booking = this.state.asReadonly();
  readonly seats = computed(() => this.state()?.seats ?? []);
  readonly tickets = computed(() => ticketsFromSeats(this.seats()));
  readonly total = computed(() => this.tickets().reduce((sum, ticket) => sum + ticket.price, 0));

  isPaid(): boolean {
    return this.state()?.paidEmail != null;
  }

  isInProgressFor(screeningId: number): boolean {
    const booking = this.state();
    return !!booking && booking.paidEmail == null && booking.screeningId === screeningId;
  }

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: { ...EMPTY_FORM }, paidEmail: null });
  }

  setSeats(seats: string[]): void {
    this.update((booking) => ({ ...booking, seats }));
  }

  setForm(form: BookingForm): void {
    this.update((booking) => ({ ...booking, form: { ...form } }));
  }

  markPaid(email: string): void {
    this.update((booking) => ({ ...booking, paidEmail: email }));
  }

  clear(): void {
    this.set(null);
  }

  private update(change: (booking: Booking) => Booking): void {
    const booking = this.state();
    if (booking) this.set(change(booking));
  }

  private set(booking: Booking | null): void {
    this.state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: the booking lives in memory only
    }
  }
}

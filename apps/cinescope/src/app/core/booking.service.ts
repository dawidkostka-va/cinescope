import { Injectable, computed, signal } from '@angular/core';
import { compareSeatIds, ticketsFromSeats } from './seats';

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export interface Booking {
  screeningId: number;
  seats: string[];
  form: CheckoutForm;
  paid: boolean;
  email: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

export const emptyForm = (): CheckoutForm => ({
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
});

function load(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.screeningId !== 'number' || !Array.isArray(data.seats)) return null;
    return {
      screeningId: data.screeningId,
      seats: data.seats.filter((s: unknown) => typeof s === 'string'),
      form: { ...emptyForm(), ...(data.form ?? {}) },
      paid: data.paid === true,
      email: typeof data.email === 'string' ? data.email : null,
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  readonly booking = signal<Booking | null>(load());
  readonly seats = computed(() => this.booking()?.seats ?? []);
  readonly tickets = computed(() => ticketsFromSeats(this.seats()));
  readonly total = computed(() => this.tickets().reduce((sum, t) => sum + t.price, 0));

  isInProgressFor(screeningId: number): boolean {
    const b = this.booking();
    return !!b && !b.paid && b.screeningId === screeningId;
  }

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: null });
  }

  setSeats(seats: string[]): void {
    this.update((b) => ({ ...b, seats: [...seats].sort(compareSeatIds) }));
  }

  setForm(form: CheckoutForm): void {
    this.update((b) => ({ ...b, form }));
  }

  markPaid(email: string): void {
    this.update((b) => ({ ...b, paid: true, email }));
  }

  clear(): void {
    this.booking.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  }

  private update(fn: (b: Booking) => Booking): void {
    const current = this.booking();
    if (current) this.set(fn(current));
  }

  private set(booking: Booking): void {
    this.booking.set(booking);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } catch {
      // storage unavailable
    }
  }
}

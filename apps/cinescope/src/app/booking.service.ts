import { Injectable, computed, signal } from '@angular/core';
import { Booking, CheckoutValues } from './models';
import { ticketsFromSeats } from './seating';

const STORAGE_KEY = 'cinescope.booking';

export function emptyForm(): CheckoutValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

function load(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Booking> | null;
    if (!value || typeof value.screeningId !== 'number' || !Array.isArray(value.seats)) return null;
    return {
      screeningId: value.screeningId,
      seats: value.seats.filter((s): s is string => typeof s === 'string'),
      form: { ...emptyForm(), ...(value.form ?? {}) },
      paid: value.paid === true,
      email: typeof value.email === 'string' ? value.email : '',
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(load());

  readonly booking = this.state.asReadonly();
  readonly tickets = computed(() => ticketsFromSeats(this.state()?.seats ?? []));
  readonly total = computed(() => this.tickets().reduce((sum, t) => sum + t.price, 0));

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: '' });
  }

  clear(): void {
    this.state.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }

  setSeats(seats: string[]): void {
    this.update((b) => ({ ...b, seats }));
  }

  setForm(form: CheckoutValues): void {
    this.update((b) => ({ ...b, form }));
  }

  markPaid(email: string): void {
    this.update((b) => ({ ...b, paid: true, email }));
  }

  private update(fn: (booking: Booking) => Booking): void {
    const current = this.state();
    if (current) this.set(fn(current));
  }

  private set(booking: Booking): void {
    this.state.set(booking);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } catch {
      /* storage unavailable */
    }
  }
}

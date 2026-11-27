import { Injectable, computed, signal } from '@angular/core';
import { Booking, CheckoutValues } from './models';
import { ticketsOf, totalOf } from './seats';

const STORAGE_KEY = 'cinescope.booking';

function load(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const value = raw ? (JSON.parse(raw) as Booking) : null;
    return value && Array.isArray(value.seats) && typeof value.screeningId === 'number' ? value : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(load());

  readonly booking = this.state.asReadonly();
  readonly tickets = computed(() => ticketsOf(this.state()?.seats ?? []));
  readonly total = computed(() => totalOf(this.tickets()));

  private set(value: Booking | null): void {
    this.state.set(value);
    try {
      if (value) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // storage unavailable: keep the in-memory booking only
    }
  }

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: null, paid: false, email: null });
  }

  clear(): void {
    this.set(null);
  }

  setSeats(seats: string[]): void {
    const current = this.state();
    if (current) {
      this.set({ ...current, seats });
    }
  }

  saveForm(form: CheckoutValues): void {
    const current = this.state();
    if (current) {
      this.set({ ...current, form });
    }
  }

  markPaid(email: string): void {
    const current = this.state();
    if (current) {
      this.set({ ...current, paid: true, email });
    }
  }

  isInProgressFor(screeningId: number | string): boolean {
    const current = this.state();
    return !!current && !current.paid && String(current.screeningId) === String(screeningId);
  }
}

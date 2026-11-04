import { Injectable, computed, signal } from '@angular/core';
import { Booking, FormValues } from './models';
import { itemsTotal, ticketItems } from './seats';

const STORAGE_KEY = 'cinescope.booking';

export const emptyForm = (): FormValues => ({
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
    const data = JSON.parse(raw) as Partial<Booking>;
    if (typeof data.screeningId !== 'number' || !Array.isArray(data.seats)) return null;
    return {
      screeningId: data.screeningId,
      seats: data.seats.filter((s): s is string => typeof s === 'string'),
      form: { ...emptyForm(), ...(data.form ?? {}) },
      paidEmail: typeof data.paidEmail === 'string' ? data.paidEmail : null,
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly state = signal<Booking | null>(load());

  readonly booking = this.state.asReadonly();
  readonly seats = computed(() => this.state()?.seats ?? []);
  readonly items = computed(() => ticketItems(this.seats()));
  readonly total = computed(() => itemsTotal(this.items()));

  isInProgressFor(screeningId: number): boolean {
    const b = this.state();
    return !!b && b.paidEmail === null && b.screeningId === screeningId;
  }

  isPaid(): boolean {
    return this.state()?.paidEmail != null;
  }

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: emptyForm(), paidEmail: null });
  }

  clear(): void {
    this.set(null);
  }

  setSeats(seats: string[]): void {
    this.patch({ seats });
  }

  setForm(form: FormValues): void {
    this.patch({ form });
  }

  markPaid(email: string): void {
    this.patch({ paidEmail: email });
  }

  private patch(change: Partial<Booking>): void {
    const current = this.state();
    if (current) {
      this.set({ ...current, ...change });
    }
  }

  private set(booking: Booking | null): void {
    this.state.set(booking);
    try {
      if (booking) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // storage unavailable: keep the in-memory booking only
    }
  }
}

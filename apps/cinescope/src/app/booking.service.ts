import { Injectable, computed, signal } from '@angular/core';
import { TicketItem, compareSeatIds, itemsFromSeats } from './seat-utils';

export interface CheckoutValues {
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
  form: CheckoutValues;
  paid: boolean;
  email: string;
}

const STORAGE_KEY = 'cinescope.booking';

export function emptyForm(): CheckoutValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

function readStored(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.screeningId !== 'number' || !Array.isArray(data.seats)) return null;
    return {
      screeningId: data.screeningId,
      seats: data.seats.filter((s: unknown) => typeof s === 'string'),
      form: { ...emptyForm(), ...(data.form ?? {}) },
      paid: data.paid === true,
      email: typeof data.email === 'string' ? data.email : '',
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(readStored());

  readonly booking = this.state.asReadonly();
  readonly items = computed<TicketItem[]>(() => itemsFromSeats(this.state()?.seats ?? []));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  startFor(screeningId: number): void {
    const current = this.state();
    if (current && !current.paid && current.screeningId === screeningId) return;
    this.write({ screeningId, seats: [], form: emptyForm(), paid: false, email: '' });
  }

  setSeats(seats: string[]): void {
    const current = this.state();
    if (current) this.write({ ...current, seats: [...seats].sort(compareSeatIds) });
  }

  setForm(form: CheckoutValues): void {
    const current = this.state();
    if (current) this.write({ ...current, form });
  }

  markPaid(email: string): void {
    const current = this.state();
    if (current) this.write({ ...current, paid: true, email });
  }

  clear(): void {
    this.write(null);
  }

  private write(booking: Booking | null): void {
    this.state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: the in-memory booking still works
    }
  }
}

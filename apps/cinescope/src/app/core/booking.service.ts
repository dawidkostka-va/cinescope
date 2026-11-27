import { Injectable, computed, signal } from '@angular/core';
import { buildItems, seatCountOf } from './seat-utils';

const STORAGE_KEY = 'cinescope.booking';

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

export const emptyForm = (): CheckoutValues => ({
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
});

const emptyBooking = (screeningId: number): Booking => ({
  screeningId,
  seats: [],
  form: emptyForm(),
  paid: false,
  email: '',
});

function read(): Booking | null {
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
  private readonly state = signal<Booking | null>(read());

  readonly booking = this.state.asReadonly();
  readonly items = computed(() => buildItems(this.state()?.seats ?? []));
  readonly seatCount = computed(() => (this.state()?.seats ?? []).reduce((sum, key) => sum + seatCountOf(key), 0));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  startFor(screeningId: number): void {
    const current = this.state();
    if (current && !current.paid && current.screeningId === screeningId) return;
    this.set(emptyBooking(screeningId));
  }

  clear(): void {
    this.set(null);
  }

  add(key: string): void {
    this.update((b) => ({ ...b, seats: [...b.seats, key] }));
  }

  remove(key: string): void {
    this.update((b) => ({ ...b, seats: b.seats.filter((s) => s !== key) }));
  }

  setForm(form: CheckoutValues): void {
    this.update((b) => ({ ...b, form }));
  }

  markPaid(email: string): void {
    this.update((b) => ({ ...b, paid: true, email }));
  }

  private update(fn: (b: Booking) => Booking): void {
    const current = this.state();
    if (current) this.set(fn(current));
  }

  private set(booking: Booking | null): void {
    this.state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: keep the in-memory booking only
    }
  }
}

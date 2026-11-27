import { Injectable, computed, signal } from '@angular/core';
import { ticketItems, totalPrice } from './seats';

export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export interface Booking {
  screeningId: number | null;
  seats: string[];
  form: CheckoutValues;
  paid: boolean;
  email: string;
}

const STORAGE_KEY = 'cinescope.booking';

export function emptyCheckoutValues(): CheckoutValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

function emptyBooking(screeningId: number | null = null): Booking {
  return { screeningId, seats: [], form: emptyCheckoutValues(), paid: false, email: '' };
}

function load(): Booking {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBooking();
    const data = JSON.parse(raw) as Partial<Booking>;
    const base = emptyBooking();
    return {
      screeningId: typeof data.screeningId === 'number' ? data.screeningId : null,
      seats: Array.isArray(data.seats) ? data.seats.filter((s) => typeof s === 'string') : [],
      form: { ...base.form, ...(data.form ?? {}) },
      paid: data.paid === true,
      email: typeof data.email === 'string' ? data.email : '',
    };
  } catch {
    return emptyBooking();
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking>(load());

  readonly booking = this.state.asReadonly();
  readonly items = computed(() => ticketItems(this.state().seats));
  readonly total = computed(() => totalPrice(this.items()));

  matchesScreening(id: number): boolean {
    const booking = this.state();
    return !booking.paid && booking.screeningId === id;
  }

  start(screeningId: number): void {
    this.set(emptyBooking(screeningId));
  }

  clear(): void {
    this.set(emptyBooking());
  }

  setSeats(seats: string[]): void {
    this.set({ ...this.state(), seats });
  }

  setForm(form: CheckoutValues): void {
    this.set({ ...this.state(), form });
  }

  markPaid(email: string): void {
    this.set({ ...this.state(), paid: true, email });
  }

  private set(booking: Booking): void {
    this.state.set(booking);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } catch {
      // storage unavailable: keep the in-memory booking only
    }
  }
}

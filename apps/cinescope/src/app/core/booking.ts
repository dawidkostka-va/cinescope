import { Injectable, computed, signal } from '@angular/core';
import { itemsFromSeats } from './seating';

export interface CheckoutForm {
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
  form: CheckoutForm;
  paid: boolean;
  email: string;
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

function load(): BookingState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<BookingState>;
    if (typeof parsed.screeningId !== 'number' || !Array.isArray(parsed.seats)) {
      return null;
    }
    return {
      screeningId: parsed.screeningId,
      seats: parsed.seats.filter((s): s is string => typeof s === 'string'),
      form: { ...emptyForm(), ...parsed.form },
      paid: parsed.paid === true,
      email: typeof parsed.email === 'string' ? parsed.email : '',
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Booking {
  private readonly state = signal<BookingState | null>(load());

  readonly current = this.state.asReadonly();
  readonly seats = computed(() => this.state()?.seats ?? []);
  readonly items = computed(() => itemsFromSeats(this.seats()));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  isInProgressFor(screeningId: number): boolean {
    const state = this.state();
    return !!state && !state.paid && state.screeningId === screeningId;
  }

  canCheckout(screeningId: number): boolean {
    const state = this.state();
    return this.isInProgressFor(screeningId) && !!state && itemsFromSeats(state.seats).length > 0;
  }

  isPaid(): boolean {
    return this.state()?.paid === true;
  }

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: '' });
  }

  clear(): void {
    this.state.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  setSeats(seats: string[]): void {
    this.update((s) => ({ ...s, seats }));
  }

  setForm(form: CheckoutForm): void {
    this.update((s) => ({ ...s, form }));
  }

  markPaid(email: string): void {
    this.update((s) => ({ ...s, paid: true, email }));
  }

  private update(fn: (state: BookingState) => BookingState): void {
    const state = this.state();
    if (state) {
      this.set(fn(state));
    }
  }

  private set(state: BookingState): void {
    this.state.set(state);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

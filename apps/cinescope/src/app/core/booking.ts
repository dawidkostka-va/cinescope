import { Injectable, computed, signal } from '@angular/core';
import { BookingItem, bookingItems } from './seats';

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

const emptyForm = (): CheckoutValues => ({
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
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw);
    if (typeof data?.screeningId !== 'number' || !Array.isArray(data.seats)) {
      return null;
    }
    return {
      screeningId: data.screeningId,
      seats: data.seats.filter((seat: unknown) => typeof seat === 'string'),
      form: { ...emptyForm(), ...data.form },
      paid: data.paid === true,
      email: typeof data.email === 'string' ? data.email : '',
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly state = signal<Booking | null>(load());

  readonly current = this.state.asReadonly();
  readonly seats = computed(() => this.state()?.seats ?? []);
  readonly items = computed<BookingItem[]>(() => bookingItems(this.seats()));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  isInProgressFor(screeningId: number): boolean {
    const booking = this.state();
    return !!booking && !booking.paid && booking.screeningId === screeningId;
  }

  start(screeningId: number): void {
    if (!this.isInProgressFor(screeningId)) {
      this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: '' });
    }
  }

  setSeats(seats: string[]): void {
    this.update((booking) => ({ ...booking, seats }));
  }

  saveForm(form: CheckoutValues): void {
    this.update((booking) => ({ ...booking, form }));
  }

  markPaid(email: string): void {
    this.update((booking) => ({ ...booking, paid: true, email }));
  }

  clear(): void {
    this.set(null);
  }

  private update(change: (booking: Booking) => Booking): void {
    const booking = this.state();
    if (booking) {
      this.set(change(booking));
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
      // storage unavailable: keep the in-memory booking
    }
  }
}

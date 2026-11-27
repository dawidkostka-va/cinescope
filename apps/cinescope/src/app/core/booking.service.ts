import { Injectable, signal } from '@angular/core';

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
  email: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

export const emptyForm = (): CheckoutValues => ({
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
    const parsed = JSON.parse(raw) as Partial<Booking>;
    if (typeof parsed.screeningId !== 'number' || !Array.isArray(parsed.seats)) return null;
    return {
      screeningId: parsed.screeningId,
      seats: parsed.seats,
      form: { ...emptyForm(), ...parsed.form },
      paid: parsed.paid === true,
      email: parsed.email ?? null,
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(load());
  readonly booking = this.state.asReadonly();

  private set(booking: Booking | null) {
    this.state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: keep the in-memory booking
    }
  }

  startFor(screeningId: number) {
    const current = this.state();
    if (current && current.screeningId === screeningId && !current.paid) return;
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: null });
  }

  setSeats(seats: string[]) {
    const current = this.state();
    if (current) this.set({ ...current, seats });
  }

  saveForm(form: CheckoutValues) {
    const current = this.state();
    if (current) this.set({ ...current, form });
  }

  markPaid(email: string) {
    const current = this.state();
    if (current) this.set({ ...current, paid: true, email });
  }

  clear() {
    this.set(null);
  }
}

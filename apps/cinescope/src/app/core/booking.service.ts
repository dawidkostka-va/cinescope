import { Injectable, computed, signal } from '@angular/core';
import { Booking, FormValues } from './models';
import { itemsFromSeats } from './seating';

const STORAGE_KEY = 'cinescope.booking';

export const EMPTY_FORM: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function load(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Booking>;
    if (typeof data.screeningId !== 'number' || !Array.isArray(data.seats)) return null;
    return {
      screeningId: data.screeningId,
      seats: data.seats.filter((s): s is string => typeof s === 'string'),
      form: { ...EMPTY_FORM, ...data.form },
      paid: data.paid === true,
      email: typeof data.email === 'string' ? data.email : '',
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(load());

  readonly booking = this.state.asReadonly();
  readonly items = computed(() => itemsFromSeats(this.state()?.seats ?? []));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: { ...EMPTY_FORM }, paid: false, email: '' });
  }

  clear(): void {
    this.set(null);
  }

  isInProgressFor(screeningId: number): boolean {
    const booking = this.state();
    return !!booking && !booking.paid && booking.screeningId === screeningId;
  }

  toggle(ids: string[]): void {
    const booking = this.state();
    if (!booking) return;
    const selected = ids.every((id) => booking.seats.includes(id));
    this.set({
      ...booking,
      seats: selected ? booking.seats.filter((s) => !ids.includes(s)) : [...booking.seats, ...ids],
    });
  }

  remove(ids: string[]): void {
    const booking = this.state();
    if (!booking) return;
    this.set({ ...booking, seats: booking.seats.filter((s) => !ids.includes(s)) });
  }

  setForm(form: FormValues): void {
    const booking = this.state();
    if (!booking) return;
    this.set({ ...booking, form });
  }

  markPaid(email: string): void {
    const booking = this.state();
    if (!booking) return;
    this.set({ ...booking, paid: true, email });
  }

  private set(booking: Booking | null): void {
    this.state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: keep the in-memory booking
    }
  }
}

import { Injectable, computed, signal } from '@angular/core';
import { Booking, FormValues } from './models';
import { Item, itemsFromSeats, totalOf } from './seats';

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
    const data = JSON.parse(raw);
    if (typeof data?.screeningId !== 'number' || !Array.isArray(data.seats)) return null;
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
  private readonly _state = signal<Booking | null>(load());

  readonly state = this._state.asReadonly();
  readonly items = computed<Item[]>(() => itemsFromSeats(this._state()?.seats ?? []));
  readonly total = computed(() => totalOf(this.items()));

  isInProgressFor(screeningId: number): boolean {
    const b = this._state();
    return !!b && !b.paid && b.screeningId === screeningId;
  }

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: '' });
  }

  setSeats(seats: string[]): void {
    this.update((b) => ({ ...b, seats }));
  }

  setForm(form: FormValues): void {
    this.update((b) => ({ ...b, form }));
  }

  markPaid(email: string): void {
    this.update((b) => ({ ...b, paid: true, email }));
  }

  clear(): void {
    this.set(null);
  }

  private update(fn: (b: Booking) => Booking): void {
    const current = this._state();
    if (current) this.set(fn(current));
  }

  private set(booking: Booking | null): void {
    this._state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: keep the in-memory booking only
    }
  }
}

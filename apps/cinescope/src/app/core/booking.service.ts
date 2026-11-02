import { Injectable, computed, signal } from '@angular/core';
import { Booking, CheckoutValues } from './models';
import { buildTickets } from './seats';

const STORAGE_KEY = 'cinescope.booking';

export const emptyForm = (): CheckoutValues => ({
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
});

const newBooking = (screeningId: number): Booking => ({
  screeningId,
  seats: [],
  form: emptyForm(),
  paid: false,
  email: '',
});

function restore(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Booking;
    if (typeof value?.screeningId !== 'number' || !Array.isArray(value.seats)) return null;
    return { ...newBooking(value.screeningId), ...value, form: { ...emptyForm(), ...value.form } };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(restore());

  readonly booking = this.state.asReadonly();
  readonly seats = computed(() => this.state()?.seats ?? []);
  readonly tickets = computed(() => buildTickets(this.seats()));
  readonly total = computed(() => this.tickets().reduce((sum, t) => sum + t.price, 0));

  isUnpaidFor(screeningId: number): boolean {
    const b = this.state();
    return !!b && !b.paid && b.screeningId === screeningId && b.seats.length > 0;
  }

  isPaid(): boolean {
    return !!this.state()?.paid;
  }

  openFor(screeningId: number): void {
    const b = this.state();
    if (b && !b.paid && b.screeningId === screeningId) return;
    this.set(newBooking(screeningId));
  }

  clear(): void {
    this.state.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  addSeats(ids: string[]): void {
    this.update((b) => ({ ...b, seats: [...b.seats, ...ids] }));
  }

  removeSeats(ids: string[]): void {
    this.update((b) => ({ ...b, seats: b.seats.filter((s) => !ids.includes(s)) }));
  }

  setForm(form: CheckoutValues): void {
    this.update((b) => ({ ...b, form }));
  }

  markPaid(email: string): void {
    this.update((b) => ({ ...b, paid: true, email }));
  }

  private update(fn: (b: Booking) => Booking): void {
    const b = this.state();
    if (b) this.set(fn(b));
  }

  private set(booking: Booking): void {
    this.state.set(booking);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }
}

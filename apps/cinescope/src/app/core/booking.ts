import { Injectable, computed, signal } from '@angular/core';
import { Booking, CheckoutValues } from './models';
import { TicketItem, itemsFromSeats, seatsFromItems } from './seats';

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
    const data = JSON.parse(raw) as Partial<Booking>;
    if (typeof data.screeningId !== 'number' || !Array.isArray(data.seats)) return null;
    return {
      screeningId: data.screeningId,
      seats: data.seats.filter((s): s is string => typeof s === 'string'),
      form: { ...emptyForm(), ...(data.form ?? {}) },
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

  readonly booking = this.state.asReadonly();
  readonly items = computed<TicketItem[]>(() => itemsFromSeats(this.state()?.seats ?? []));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  private set(booking: Booking | null): void {
    this.state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: keep the in-memory booking
    }
  }

  isInProgressFor(screeningId: number): boolean {
    const booking = this.state();
    return !!booking && !booking.paid && booking.screeningId === screeningId;
  }

  openFor(screeningId: number): void {
    if (this.isInProgressFor(screeningId)) return;
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: '' });
  }

  setItems(items: TicketItem[]): void {
    const booking = this.state();
    if (!booking) return;
    this.set({ ...booking, seats: seatsFromItems(items) });
  }

  setForm(form: CheckoutValues): void {
    const booking = this.state();
    if (!booking) return;
    this.set({ ...booking, form });
  }

  markPaid(email: string): void {
    const booking = this.state();
    if (!booking) return;
    this.set({ ...booking, paid: true, email });
  }

  clear(): void {
    this.set(null);
  }
}

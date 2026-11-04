import { Injectable, computed, signal } from '@angular/core';
import { Booking, FormValues, SeatItem } from './models';
import { MAX_SEATS, itemSize, seatCount, sameItem, sortedItems, totalPrice } from './seats';

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
    const b = JSON.parse(raw) as Booking;
    if (typeof b?.screeningId !== 'number' || !Array.isArray(b.items)) return null;
    return { ...b, form: { ...EMPTY_FORM, ...b.form }, paid: !!b.paid, email: b.email ?? '' };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(load());

  readonly booking = this.state.asReadonly();
  readonly items = computed(() => this.state()?.items ?? []);
  readonly seatCount = computed(() => seatCount(this.items()));
  readonly total = computed(() => totalPrice(this.items()));

  /** Booking in progress for the screening: unpaid and matching id. */
  inProgressFor(screeningId: number): Booking | null {
    const b = this.state();
    return b && !b.paid && b.screeningId === screeningId ? b : null;
  }

  /** Unpaid, for this screening, with at least one seat. */
  isReadyFor(screeningId: number): boolean {
    const b = this.inProgressFor(screeningId);
    return !!b && b.items.length > 0;
  }

  isPaid(): boolean {
    return !!this.state()?.paid;
  }

  start(screeningId: number): void {
    this.set({ screeningId, items: [], form: { ...EMPTY_FORM }, paid: false, email: '' });
  }

  clear(): void {
    this.state.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /** Returns false when the click would exceed the seat limit. */
  addItem(item: SeatItem): boolean {
    const b = this.state();
    if (!b) return false;
    if (seatCount(b.items) + itemSize(item) > MAX_SEATS) return false;
    this.set({ ...b, items: sortedItems([...b.items, item]) });
    return true;
  }

  removeItem(item: SeatItem): void {
    const b = this.state();
    if (!b) return;
    this.set({ ...b, items: b.items.filter((i) => !sameItem(i, item)) });
  }

  setForm(form: FormValues): void {
    const b = this.state();
    if (b) this.set({ ...b, form });
  }

  markPaid(email: string): void {
    const b = this.state();
    if (b) this.set({ ...b, paid: true, email });
  }

  private set(b: Booking): void {
    this.state.set(b);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(b));
  }
}

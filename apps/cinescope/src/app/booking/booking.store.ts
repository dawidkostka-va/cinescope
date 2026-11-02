import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'cinescope.booking';
export const MAX_SEATS = 10;

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
  paidEmail: string | null;
}

export type ToggleResult = 'added' | 'removed' | 'limit' | 'ignored';

function emptyForm(): CheckoutValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

function load(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Booking) : null;
}

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly current = signal<Booking | null>(load());

  readonly booking = this.current.asReadonly();
  readonly seatCount = computed(() => this.current()?.seats.length ?? 0);

  selectedFor(screeningId: number): readonly string[] {
    const booking = this.current();
    return booking && booking.screeningId === screeningId ? booking.seats : [];
  }

  start(screeningId: number): void {
    const existing = this.current();
    if (existing && existing.screeningId === screeningId && existing.paidEmail === null) {
      return;
    }
    this.write({ screeningId, seats: [], form: emptyForm(), paidEmail: null });
  }

  toggle(screeningId: number, ids: readonly string[]): ToggleResult {
    const booking = this.current();
    if (!booking || booking.screeningId !== screeningId) {
      return 'ignored';
    }
    const isSelected = ids.every((id) => booking.seats.includes(id));
    if (isSelected) {
      this.write({ ...booking, seats: booking.seats.filter((id) => !ids.includes(id)) });
      return 'removed';
    }
    if (booking.seats.length + ids.length > MAX_SEATS) {
      return 'limit';
    }
    this.write({ ...booking, seats: [...booking.seats, ...ids] });
    return 'added';
  }

  removeTickets(ids: readonly string[]): void {
    const booking = this.current();
    if (!booking) {
      return;
    }
    this.write({ ...booking, seats: booking.seats.filter((id) => !ids.includes(id)) });
  }

  setForm(values: Partial<CheckoutValues>): void {
    const booking = this.current();
    if (!booking) {
      return;
    }
    this.write({ ...booking, form: { ...booking.form, ...values } });
  }

  markPaid(email: string): void {
    const booking = this.current();
    if (!booking) {
      return;
    }
    this.write({ ...booking, paidEmail: email });
  }

  clear(): void {
    this.write(null);
  }

  private write(booking: Booking | null): void {
    this.current.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

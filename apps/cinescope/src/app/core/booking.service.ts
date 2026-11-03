import { Injectable, computed, signal } from '@angular/core';
import { MAX_SEATS, SeatItem, itemsFromIds } from './seat-layout';

export interface CheckoutForm {
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
  form: CheckoutForm;
  paid: boolean;
  email: string | null;
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

function isBooking(value: unknown): value is Booking {
  const b = value as Booking | null;
  return (
    !!b &&
    typeof b.screeningId === 'number' &&
    Array.isArray(b.seats) &&
    typeof b.paid === 'boolean' &&
    !!b.form &&
    typeof b.form === 'object'
  );
}

function read(): Booking | null {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    return isBooking(parsed) ? { ...parsed, form: { ...emptyForm(), ...parsed.form } } : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(read());

  readonly booking = this.state.asReadonly();
  readonly items = computed(() => itemsFromIds(this.state()?.seats ?? []));
  readonly seatCount = computed(() => this.state()?.seats.length ?? 0);
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  open(screeningId: number): void {
    const current = this.state();
    if (current && !current.paid && current.screeningId === screeningId) return;
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: null });
  }

  isSelected(item: SeatItem): boolean {
    const seats = this.state()?.seats ?? [];
    return item.ids.every((id) => seats.includes(id));
  }

  toggle(item: SeatItem): 'ok' | 'limit' {
    const current = this.state();
    if (!current) return 'ok';
    if (this.isSelected(item)) {
      this.setSeats(current, current.seats.filter((id) => !item.ids.includes(id)));
      return 'ok';
    }
    if (current.seats.length + item.ids.length > MAX_SEATS) return 'limit';
    this.setSeats(current, [...current.seats, ...item.ids]);
    return 'ok';
  }

  remove(item: SeatItem): void {
    const current = this.state();
    if (current) this.setSeats(current, current.seats.filter((id) => !item.ids.includes(id)));
  }

  setForm(form: CheckoutForm): void {
    const current = this.state();
    if (current) this.set({ ...current, form: { ...form } });
  }

  markPaid(email: string): void {
    const current = this.state();
    if (current) this.set({ ...current, paid: true, email });
  }

  clear(): void {
    this.set(null);
  }

  private setSeats(current: Booking, seats: string[]): void {
    const sorted = itemsFromIds(seats).flatMap((item) => item.ids);
    this.set({ ...current, seats: sorted });
  }

  private set(booking: Booking | null): void {
    this.state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: the booking then lives in memory only
    }
  }
}

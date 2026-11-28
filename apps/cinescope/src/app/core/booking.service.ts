import { Injectable, computed, signal } from '@angular/core';
import { MAX_SEATS, buildItems } from './seating';

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
  email: string;
}

const STORAGE_KEY = 'cinescope.booking';

export function emptyForm(): CheckoutForm {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

function newBooking(screeningId: number): Booking {
  return { screeningId, seats: [], form: emptyForm(), paid: false, email: '' };
}

function read(): Booking | null {
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
export class BookingService {
  private readonly state = signal<Booking | null>(read());

  readonly booking = this.state.asReadonly();
  readonly items = computed(() => buildItems(this.state()?.seats ?? []));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));
  readonly seatCount = computed(() => this.state()?.seats.length ?? 0);

  isInProgressFor(screeningId: number): boolean {
    const b = this.state();
    return !!b && !b.paid && b.screeningId === screeningId;
  }

  open(screeningId: number): void {
    if (!this.isInProgressFor(screeningId)) this.set(newBooking(screeningId));
  }

  clear(): void {
    this.state.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  }

  hasRoomFor(count: number): boolean {
    return this.seatCount() + count <= MAX_SEATS;
  }

  addSeats(ids: string[]): void {
    this.update((b) => ({ ...b, seats: [...b.seats, ...ids.filter((id) => !b.seats.includes(id))] }));
  }

  removeSeats(ids: string[]): void {
    this.update((b) => ({ ...b, seats: b.seats.filter((id) => !ids.includes(id)) }));
  }

  patchForm(patch: Partial<CheckoutForm>): void {
    this.update((b) => ({ ...b, form: { ...b.form, ...patch } }));
  }

  markPaid(email: string): void {
    this.update((b) => ({ ...b, paid: true, email }));
  }

  private update(fn: (b: Booking) => Booking): void {
    const current = this.state();
    if (current) this.set(fn(current));
  }

  private set(booking: Booking): void {
    this.state.set(booking);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } catch {
      // storage unavailable
    }
  }
}

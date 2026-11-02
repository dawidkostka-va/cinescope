import { Injectable, computed, signal } from '@angular/core';
import { Booking, CustomerForm } from './models';
import { Ticket, ticketsFromSeats } from './seats';

const STORAGE_KEY = 'cinescope.booking';

export const emptyForm = (): CustomerForm => ({
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
});

function read(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Booking;
    if (typeof parsed?.screeningId !== 'number' || !Array.isArray(parsed.seats)) return null;
    return { ...parsed, form: { ...emptyForm(), ...parsed.form }, paid: !!parsed.paid, email: parsed.email ?? '' };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(read());

  readonly booking = this.state.asReadonly();
  readonly tickets = computed<Ticket[]>(() => ticketsFromSeats(this.state()?.seats ?? []));
  readonly total = computed(() => this.tickets().reduce((sum, t) => sum + t.price, 0));

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: '' });
  }

  startIfNeeded(screeningId: number): void {
    const b = this.state();
    if (!b || b.paid || b.screeningId !== screeningId) this.start(screeningId);
  }

  setSeats(seats: string[]): void {
    this.patch({ seats });
  }

  setForm(form: CustomerForm): void {
    this.patch({ form });
  }

  markPaid(email: string): void {
    this.patch({ paid: true, email });
  }

  clear(): void {
    this.set(null);
  }

  private patch(change: Partial<Booking>): void {
    const b = this.state();
    if (b) this.set({ ...b, ...change });
  }

  private set(booking: Booking | null): void {
    this.state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: keep the in-memory booking only
    }
  }
}

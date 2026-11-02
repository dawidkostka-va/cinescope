import { Injectable, computed, signal } from '@angular/core';
import { Booking, FormValues } from './models';
import { buildItems } from './seat-utils';

const KEY = 'cinescope.booking';

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
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const b = JSON.parse(raw) as Booking;
    if (typeof b?.screeningId !== 'number' || !Array.isArray(b.seats)) return null;
    return { ...b, form: { ...emptyForm(), ...b.form }, paid: !!b.paid, email: b.email ?? null };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(load());

  readonly booking = this.state.asReadonly();
  readonly items = computed(() => buildItems(this.state()?.seats ?? []));
  readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0));

  private set(b: Booking | null) {
    this.state.set(b);
    try {
      if (b) sessionStorage.setItem(KEY, JSON.stringify(b));
      else sessionStorage.removeItem(KEY);
    } catch {
      // storage unavailable: keep the in-memory booking only
    }
  }

  startNew(screeningId: number) {
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: null });
  }

  clear() {
    this.set(null);
  }

  setSeats(seats: string[]) {
    const b = this.state();
    if (b) this.set({ ...b, seats });
  }

  setForm(form: FormValues) {
    const b = this.state();
    if (b) this.set({ ...b, form });
  }

  markPaid(email: string) {
    const b = this.state();
    if (b) this.set({ ...b, paid: true, email });
  }

  isInProgressFor(screeningId: string | number | null | undefined): boolean {
    const b = this.state();
    return !!b && !b.paid && String(b.screeningId) === String(screeningId);
  }
}

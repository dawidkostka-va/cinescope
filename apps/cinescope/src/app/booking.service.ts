import { Injectable, computed, signal } from '@angular/core';

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
  paid: boolean;
  email: string | null;
}

export interface Ticket {
  row: number;
  colStart: number;
  colEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export const MAX_SEATS = 10;
export const COUCH_ROW = 15;

const STORAGE_KEY = 'cinescope.booking';

export const emptyForm = (): CheckoutValues => ({
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
});

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function seatPrice(row: number): number {
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export const COUCH_PRICE = 89;

export function formatPrice(value: number): string {
  return value.toFixed(2);
}

export function buildTickets(seats: string[]): Ticket[] {
  const tickets = new Map<string, Ticket>();
  for (const id of seats) {
    const m = /^R(\d+)C(\d+)$/.exec(id);
    if (!m) continue;
    const row = Number(m[1]);
    const col = Number(m[2]);
    if (row === COUCH_ROW) {
      const start = col % 2 === 1 ? col : col - 1;
      const key = `${row}-${start}`;
      if (!tickets.has(key)) {
        tickets.set(key, {
          row,
          colStart: start,
          colEnd: start + 1,
          couch: true,
          ids: [seatId(row, start), seatId(row, start + 1)],
          price: COUCH_PRICE,
        });
      }
    } else {
      tickets.set(id, { row, colStart: col, colEnd: col, couch: false, ids: [id], price: seatPrice(row) });
    }
  }
  return [...tickets.values()].sort((a, b) => a.row - b.row || a.colStart - b.colStart);
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(this.load());

  readonly booking = this.state.asReadonly();
  readonly tickets = computed(() => buildTickets(this.state()?.seats ?? []));
  readonly seatCount = computed(() => this.tickets().reduce((sum, t) => sum + t.ids.length, 0));
  readonly total = computed(() => this.tickets().reduce((sum, t) => sum + t.price, 0));

  private load(): Booking | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const b = JSON.parse(raw) as Booking;
      if (typeof b?.screeningId !== 'number' || !Array.isArray(b.seats) || !b.form) return null;
      return { ...b, form: { ...emptyForm(), ...b.form } };
    } catch {
      return null;
    }
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

  openFor(screeningId: number): void {
    const b = this.state();
    if (b && !b.paid && b.screeningId === screeningId) return;
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: null });
  }

  setSeats(seats: string[]): void {
    const b = this.state();
    if (b) this.set({ ...b, seats });
  }

  remove(ticket: Ticket): void {
    const b = this.state();
    if (b) this.set({ ...b, seats: b.seats.filter((s) => !ticket.ids.includes(s)) });
  }

  updateForm(form: CheckoutValues): void {
    const b = this.state();
    if (b) this.set({ ...b, form });
  }

  markPaid(email: string): void {
    const b = this.state();
    if (b) this.set({ ...b, paid: true, email });
  }

  clear(): void {
    this.set(null);
  }
}

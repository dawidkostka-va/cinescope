import { Injectable, signal } from '@angular/core';
import { Booking, FormValues } from './models';
import { compareKeys } from './seats';

const STORAGE_KEY = 'cinescope.booking';

export const EMPTY_FORM: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function read(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const b = JSON.parse(raw);
    const f = b?.form;
    const valid =
      typeof b?.screeningId === 'number' &&
      Array.isArray(b.items) &&
      b.items.every((i: unknown) => typeof i === 'string') &&
      typeof b.paid === 'boolean' &&
      typeof b.email === 'string' &&
      f &&
      (['firstName', 'lastName', 'email', 'confirmEmail', 'phone'] as const).every(
        (k) => typeof f[k] === 'string',
      ) &&
      typeof f.terms === 'boolean';
    return valid ? (b as Booking) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(read());
  readonly booking = this.state.asReadonly();

  start(screeningId: number): void {
    this.set({ screeningId, items: [], form: { ...EMPTY_FORM }, paid: false, email: '' });
  }

  clear(): void {
    this.set(null);
  }

  setItems(items: string[]): void {
    this.update((b) => ({ ...b, items: [...items].sort(compareKeys) }));
  }

  setForm(form: FormValues): void {
    this.update((b) => ({ ...b, form }));
  }

  markPaid(email: string): void {
    this.update((b) => ({ ...b, paid: true, email }));
  }

  private update(fn: (b: Booking) => Booking): void {
    const current = this.state();
    if (current) this.set(fn(current));
  }

  private set(booking: Booking | null): void {
    this.state.set(booking);
    try {
      if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: the in-memory booking still works
    }
  }
}

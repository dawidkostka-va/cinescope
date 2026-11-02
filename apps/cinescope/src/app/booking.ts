import { Injectable, signal } from '@angular/core';
import { Booking, FormValues } from './models';

const KEY = 'cinescope.booking';

export const emptyForm = (): FormValues => ({ firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false });

function load(): Booking | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private state = signal<Booking | null>(load());
  readonly booking = this.state.asReadonly();

  start(screeningId: number): void {
    this.set({ screeningId, seats: [], form: emptyForm(), paid: false, email: '' });
  }

  setSeats(seats: string[]): void {
    const b = this.state();
    if (b) this.set({ ...b, seats });
  }

  setForm(form: FormValues): void {
    const b = this.state();
    if (b) this.set({ ...b, form });
  }

  markPaid(email: string): void {
    const b = this.state();
    if (b) this.set({ ...b, paid: true, email });
  }

  clear(): void {
    this.state.set(null);
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }

  private set(b: Booking): void {
    this.state.set(b);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(b));
    } catch {
      /* storage unavailable */
    }
  }
}

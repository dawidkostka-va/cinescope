import { Injectable, signal } from '@angular/core';
import { Booking, BookingFormValues, emptyFormValues } from './models';

const STORAGE_KEY = 'cinescope.booking';

function readStorage(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<Booking | null>(readStorage());
  readonly booking = this.state.asReadonly();

  private write(booking: Booking | null): void {
    this.state.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  startNew(screeningId: number): Booking {
    const booking: Booking = {
      screeningId,
      seats: [],
      form: emptyFormValues(),
      paid: false,
      customerEmail: null,
    };
    this.write(booking);
    return booking;
  }

  setSeats(seats: string[]): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.write({ ...current, seats });
  }

  setForm(form: BookingFormValues): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.write({ ...current, form });
  }

  markPaid(email: string): void {
    const current = this.state();
    if (!current) {
      return;
    }
    this.write({ ...current, paid: true, customerEmail: email });
  }

  clear(): void {
    this.write(null);
  }
}

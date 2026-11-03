import { Injectable, signal } from '@angular/core';

export interface CustomerForm {
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
  form: CustomerForm;
  paidEmail: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

export function emptyForm(): CustomerForm {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  readonly booking = signal<Booking | null>(this.read());

  save(booking: Booking): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    this.booking.set(booking);
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.booking.set(null);
  }

  private read(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  }
}

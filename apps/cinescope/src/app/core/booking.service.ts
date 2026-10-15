import { Injectable, inject, signal } from '@angular/core';
import { SeatUnit, couchIds, seatId } from './seat.util';
import { ToastService } from './toast.service';

export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  termsAccepted: boolean;
}

export interface BookingState {
  screeningId: number;
  seats: string[];
  form: CheckoutFormValues;
  paid: boolean;
  email: string | null;
}

const STORAGE_KEY = 'cinescope.booking';
const MAX_SEATS = 10;

export const EMPTY_FORM: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  termsAccepted: false,
};

function emptyBooking(screeningId: number): BookingState {
  return { screeningId, seats: [], form: { ...EMPTY_FORM }, paid: false, email: null };
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly toast = inject(ToastService);

  private readonly state = signal<BookingState | null>(loadFromStorage());
  readonly booking = this.state.asReadonly();

  /** Keeps the booking in progress for this screening, or starts a fresh one otherwise. */
  ensureBookingFor(screeningId: number): void {
    const current = this.state();
    if (!current || current.paid || current.screeningId !== screeningId) {
      this.persist(emptyBooking(screeningId));
    }
  }

  isValidFor(screeningId: number): boolean {
    const booking = this.state();
    return !!booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;
  }

  isPaid(): boolean {
    return this.state()?.paid === true;
  }

  clear(): void {
    this.persist(null);
  }

  toggleSeat(id: string): void {
    const booking = this.state();
    if (!booking) return;
    if (booking.seats.includes(id)) {
      this.setSeats(booking.seats.filter((s) => s !== id));
      return;
    }
    if (!this.canAdd(booking.seats.length, 1)) return;
    this.setSeats([...booking.seats, id]);
  }

  toggleCouch(row: number, columnStart: number, columnEnd: number): void {
    const booking = this.state();
    if (!booking) return;
    const [idA, idB] = couchIds(row, columnStart, columnEnd);
    if (booking.seats.includes(idA) || booking.seats.includes(idB)) {
      this.setSeats(booking.seats.filter((s) => s !== idA && s !== idB));
      return;
    }
    if (!this.canAdd(booking.seats.length, 2)) return;
    this.setSeats([...booking.seats, idA, idB]);
  }

  removeUnit(unit: SeatUnit): void {
    const booking = this.state();
    if (!booking) return;
    if (unit.type === 'couch') {
      const [idA, idB] = couchIds(unit.row, unit.columnStart as number, unit.columnEnd as number);
      this.setSeats(booking.seats.filter((s) => s !== idA && s !== idB));
    } else {
      const id = seatId(unit.row, unit.column as number);
      this.setSeats(booking.seats.filter((s) => s !== id));
    }
  }

  updateForm(partial: Partial<CheckoutFormValues>): void {
    const booking = this.state();
    if (!booking) return;
    this.persist({ ...booking, form: { ...booking.form, ...partial } });
  }

  markPaid(email: string): void {
    const booking = this.state();
    if (!booking) return;
    this.persist({ ...booking, paid: true, email });
  }

  private canAdd(currentCount: number, add: number): boolean {
    if (currentCount + add > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return false;
    }
    return true;
  }

  private setSeats(seats: string[]): void {
    const booking = this.state();
    if (!booking) return;
    this.persist({ ...booking, seats });
  }

  private persist(state: BookingState | null): void {
    this.state.set(state);
    if (state) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

function loadFromStorage(): BookingState | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingState;
  } catch {
    return null;
  }
}

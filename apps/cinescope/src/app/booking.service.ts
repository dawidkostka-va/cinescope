import { Injectable, signal } from '@angular/core';
import { isSameSelection, MAX_SEATS, seatCount, Selection } from './auditorium';

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
  selections: Selection[];
  form: CustomerForm;
  paid: boolean;
}

export const EMPTY_FORM: CustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

const STORAGE_KEY = 'cinescope.booking';

@Injectable({ providedIn: 'root' })
export class BookingService {
  readonly current = signal<Booking | null>(this.load());

  startOrKeep(screeningId: number): void {
    const booking = this.current();
    if (booking && !booking.paid && booking.screeningId === screeningId) {
      return;
    }
    this.save({ screeningId, selections: [], form: { ...EMPTY_FORM }, paid: false });
  }

  toggleSelection(selection: Selection): boolean {
    const booking = this.current();
    if (!booking) {
      return false;
    }
    if (booking.selections.some((s) => isSameSelection(s, selection))) {
      this.removeSelection(selection);
      return true;
    }
    if (seatCount(booking.selections) + seatCount([selection]) > MAX_SEATS) {
      return false;
    }
    this.patch({ selections: [...booking.selections, selection] });
    return true;
  }

  removeSelection(selection: Selection): void {
    const booking = this.current();
    if (!booking) {
      return;
    }
    this.patch({ selections: booking.selections.filter((s) => !isSameSelection(s, selection)) });
  }

  updateForm(patch: Partial<CustomerForm>): void {
    const booking = this.current();
    if (booking) {
      this.patch({ form: { ...booking.form, ...patch } });
    }
  }

  markPaid(): void {
    this.patch({ paid: true });
  }

  clear(): void {
    this.save(null);
  }

  private patch(changes: Partial<Booking>): void {
    const booking = this.current();
    if (booking) {
      this.save({ ...booking, ...changes });
    }
  }

  private save(booking: Booking | null): void {
    this.current.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  private load(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  }
}

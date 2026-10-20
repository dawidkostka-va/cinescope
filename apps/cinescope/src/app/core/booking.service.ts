import { Injectable, signal } from '@angular/core';
import { BookingState, CheckoutFormValues } from './models';
import { MAX_SEATS_PER_BOOKING } from './seat-map.util';

const STORAGE_KEY = 'cinescope.booking';

export type ToggleResult = 'added' | 'removed' | 'limit';

function emptyForm(): CheckoutFormValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

function emptyBooking(screeningId: number | null = null): BookingState {
  return { screeningId, seats: [], paid: false, email: null, form: emptyForm() };
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly state = signal<BookingState>(this.load());
  readonly booking = this.state.asReadonly();

  private load(): BookingState {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as BookingState;
      }
    } catch {
      // ignore corrupt storage
    }
    return emptyBooking();
  }

  private persist(next: BookingState): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private update(fn: (current: BookingState) => BookingState): void {
    const next = fn(this.state());
    this.state.set(next);
    this.persist(next);
  }

  /** Keeps the current selection when it belongs to this screening and is unpaid, otherwise starts fresh. */
  ensureBookingFor(screeningId: number): void {
    const current = this.state();
    if (current.paid || current.screeningId !== screeningId) {
      this.update(() => emptyBooking(screeningId));
    }
  }

  toggleSelection(ids: string[]): ToggleResult {
    const current = this.state();
    const alreadySelected = ids.every((id) => current.seats.includes(id));

    if (alreadySelected) {
      this.update((state) => ({ ...state, seats: state.seats.filter((id) => !ids.includes(id)) }));
      return 'removed';
    }

    if (current.seats.length + ids.length > MAX_SEATS_PER_BOOKING) {
      return 'limit';
    }

    this.update((state) => ({ ...state, seats: [...state.seats, ...ids] }));
    return 'added';
  }

  removeSeats(ids: string[]): void {
    this.update((state) => ({ ...state, seats: state.seats.filter((id) => !ids.includes(id)) }));
  }

  setFormValues(values: CheckoutFormValues): void {
    this.update((state) => ({ ...state, form: values }));
  }

  markPaid(email: string): void {
    this.update((state) => ({ ...state, paid: true, email }));
  }

  clear(): void {
    this.update(() => emptyBooking());
  }
}

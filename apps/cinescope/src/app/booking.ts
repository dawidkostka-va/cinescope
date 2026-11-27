import { Injectable } from '@angular/core';

/** A selected seat, or a couch covering two adjacent columns of row 15. */
export interface BookedSeat {
  kind: 'seat' | 'couch';
  row: number;
  /** The column of a seat, or the left column of a couch. */
  column: number;
  /** Equal to `column` for a seat, `column + 1` for a couch. */
  columnEnd: number;
}

/** The values typed into the checkout form, kept as they are typed (section 7.1). */
export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  termsAccepted: boolean;
}

/** The booking: one screening, the seats chosen for it and, once paid, the customer's email. */
export interface Booking {
  screeningId: number;
  seats: BookedSeat[];
  /** The checkout form values. Absent until the form is first changed. */
  checkout?: CheckoutValues;
  /** The customer's email address once the booking is paid; absent while it is in progress. */
  paidEmail?: string;
}

const STORAGE_KEY = 'cinescope.booking';

/** Orders seats by row, then by column. */
export function sortSeats(seats: readonly BookedSeat[]): BookedSeat[] {
  return [...seats].sort((a, b) => a.row - b.row || a.column - b.column);
}

/** Whether two entries are the same seat or couch. */
export function isSameSeat(a: BookedSeat, b: BookedSeat): boolean {
  return a.row === b.row && a.column === b.column;
}

/**
 * Keeps the booking in `sessionStorage`, so it survives a page reload. The storage is read on
 * every call; nothing is cached, so the guards and the screens always see the same booking.
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  /** The booking in progress, or null when there is none. */
  current(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    try {
      const value = JSON.parse(raw) as Partial<Booking> | null;
      if (value && Number.isInteger(value.screeningId) && Array.isArray(value.seats)) {
        return {
          screeningId: value.screeningId as number,
          seats: value.seats,
          checkout: value.checkout,
          paidEmail: value.paidEmail,
        };
      }
    } catch {
      // A corrupted entry is treated as no booking.
    }
    return null;
  }

  /** Replaces the booking in progress. */
  save(booking: Booking): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }

  /**
   * Replaces the seats of the booking for a screening and keeps the rest of it (the checkout
   * values). The seat map and the summary both change the seats of the booking in progress.
   */
  saveSeats(screeningId: number, seats: BookedSeat[]): void {
    const current = this.current();
    this.save({ ...(current?.screeningId === screeningId ? current : {}), screeningId, seats });
  }

  /** Keeps the checkout form values in the booking in progress. */
  saveCheckout(checkout: CheckoutValues): void {
    const current = this.current();
    if (current) {
      this.save({ ...current, checkout });
    }
  }

  /** Marks the booking in progress as paid, with the customer's email address. */
  markPaid(email: string): void {
    const current = this.current();
    if (current) {
      this.save({ ...current, paidEmail: email });
    }
  }

  /**
   * The booking for a screening: the booking in progress when it belongs to that screening and
   * is not paid yet, otherwise a new, empty booking that replaces the previous one.
   */
  openFor(screeningId: number): Booking {
    const current = this.current();
    if (current?.screeningId === screeningId && current.paidEmail === undefined) {
      return current;
    }
    const booking: Booking = { screeningId, seats: [] };
    this.save(booking);
    return booking;
  }

  /** Removes the booking. */
  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

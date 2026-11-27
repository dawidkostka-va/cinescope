import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { COUCH_ROW, seatId } from './seat-selection/auditorium';
import { COUCH_PRICE, seatPrice } from './pricing';
import { CheckoutValues, EMPTY_CHECKOUT } from './checkout/checkout-rules';

/** The booking in progress, kept in `sessionStorage` (section 3.1). */
export interface Booking {
  screeningId: number;
  /** Seat identifiers; a couch contributes both of its identifiers. */
  seats: string[];
  /** The checkout form values, as typed (section 7.1). */
  checkout: CheckoutValues;
  /** The customer's email address once the booking is paid. */
  paidEmail?: string;
}

/** One line of the summary: a single seat or a couch. */
export interface TicketItem {
  row: number;
  /** `<column>` for a seat, `Couch <a>-<b>` for a couch. */
  seat: string;
  seatIds: string[];
  price: number;
}

const STORAGE_KEY = 'cinescope.booking';
const SEAT_ID_PATTERN = /^R(\d+)C(\d+)$/;

@Injectable({ providedIn: 'root' })
export class BookingStore {
  read(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    try {
      const booking = JSON.parse(raw) as Partial<Booking>;
      if (typeof booking.screeningId !== 'number' || !Array.isArray(booking.seats)) {
        return null;
      }
      // Bookings stored before the checkout existed have no form values.
      return {
        screeningId: booking.screeningId,
        seats: booking.seats,
        checkout: { ...EMPTY_CHECKOUT, ...booking.checkout },
        paidEmail: booking.paidEmail,
      };
    } catch {
      return null;
    }
  }

  write(booking: Booking): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Turns seat identifiers into the tickets of the summary, ordered by row and then by column.
 * Couches only exist in the couch row, where they are always the pairs of columns 1–2, 3–4, …
 */
export function ticketsFor(seats: readonly string[]): TicketItem[] {
  const columnsByRow = new Map<number, number[]>();
  for (const id of seats) {
    const match = SEAT_ID_PATTERN.exec(id);
    if (!match) {
      continue;
    }
    const row = Number(match[1]);
    const columns = columnsByRow.get(row) ?? [];
    columns.push(Number(match[2]));
    columnsByRow.set(row, columns);
  }

  const items: TicketItem[] = [];
  for (const row of [...columnsByRow.keys()].sort((a, b) => a - b)) {
    const columns = (columnsByRow.get(row) ?? []).sort((a, b) => a - b);
    for (let index = 0; index < columns.length; ) {
      const column = columns[index];
      const next = columns[index + 1];
      if (row === COUCH_ROW && column % 2 === 1 && next === column + 1) {
        items.push({
          row,
          seat: `Couch ${column}-${next}`,
          seatIds: [seatId(row, column), seatId(row, next)],
          price: COUCH_PRICE,
        });
        index += 2;
      } else {
        items.push({ row, seat: `${column}`, seatIds: [seatId(row, column)], price: seatPrice(row) });
        index += 1;
      }
    }
  }
  return items;
}

/** A booking is paid once the checkout has stored the customer's email address in it. */
export function isPaid(booking: Booking): boolean {
  return booking.paidEmail !== undefined;
}

/**
 * Lets a route be entered only with an unpaid booking in progress for the screening in the URL
 * that has at least one seat (section 3.1).
 */
export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingStore).read();
  const screeningId = Number(route.paramMap.get('id'));
  if (
    booking &&
    !isPaid(booking) &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0
  ) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};

/** Lets a route be entered only once the booking in progress has been paid (section 3.1). */
export const bookingPaidGuard: CanActivateFn = () => {
  const booking = inject(BookingStore).read();
  if (booking && isPaid(booking)) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};

import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

/**
 * The booking in progress (section 3.1). `seats` holds seat identifiers; a couch contributes
 * both of its identifiers.
 */
/** The values typed into the checkout form (section 7.1). */
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
  /** The checkout form values as last typed; absent until the form has been changed. */
  checkout?: CheckoutValues;
  /** Set once the booking is paid: the customer's email address (section 3.1). */
  paid?: { email: string };
}

/** One line of the summary: a single seat or a couch (section 6). */
export interface Ticket {
  /** Seat identifiers the ticket occupies: one for a seat, two for a couch. */
  ids: string[];
  row: number;
  /** The column number of a seat, or `Couch <a>-<b>`. */
  seat: string;
  /** Price in PLN. */
  price: number;
}

const STORAGE_KEY = 'cinescope.booking';
const COUCH_ROW = 15;
const COUCH_PRICE = 89;
const SEAT_ID_PATTERN = /^R(\d+)C(\d+)$/;

function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

function parseSeatId(id: string): { row: number; column: number } | null {
  const match = SEAT_ID_PATTERN.exec(id);
  return match ? { row: Number(match[1]), column: Number(match[2]) } : null;
}

/** Price of one seat in the given row (section 5.4). */
function seatPrice(row: number): number {
  if (row <= 5) {
    return 25;
  }
  if (row <= 10) {
    return 32;
  }
  return 39;
}

/** Formats an amount as the price label, e.g. `25.00 PLN`. */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

/** The summary lines of a set of seat identifiers, ordered by row and then by column. */
export function ticketsFor(seatIds: readonly string[]): Ticket[] {
  const seats = seatIds
    .map(parseSeatId)
    .filter((seat): seat is { row: number; column: number } => seat !== null)
    .sort((a, b) => a.row - b.row || a.column - b.column);

  const tickets: Ticket[] = [];
  const couches = new Set<number>();
  for (const { row, column } of seats) {
    if (row === COUCH_ROW) {
      // Couches cover columns 1–2, 3–4, … 23–24, so a couch starts at an odd column.
      const start = column % 2 === 1 ? column : column - 1;
      if (couches.has(start)) {
        continue;
      }
      couches.add(start);
      tickets.push({
        ids: [seatId(row, start), seatId(row, start + 1)],
        row,
        seat: `Couch ${start}-${start + 1}`,
        price: COUCH_PRICE,
      });
    } else {
      tickets.push({
        ids: [seatId(row, column)],
        row,
        seat: String(column),
        price: seatPrice(row),
      });
    }
  }
  return tickets;
}

/** Keeps the booking in progress in `sessionStorage`, so it survives a reload. */
@Injectable({ providedIn: 'root' })
export class BookingService {
  /** The booking in progress, or null when there is none or it cannot be read. */
  load(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as Booking;
    } catch {
      return null;
    }
  }

  save(booking: Booking): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /**
   * The seats of the booking in progress when it belongs to the screening and is unpaid,
   * otherwise none.
   */
  seatsFor(screeningId: string | undefined): string[] {
    const booking = this.load();
    return booking !== null &&
      booking.paid === undefined &&
      booking.screeningId === Number(screeningId)
      ? booking.seats
      : [];
  }

  /** Changes some fields of the booking in progress, keeping the others. Does nothing without one. */
  update(changes: Partial<Booking>): void {
    const booking = this.load();
    if (booking !== null) {
      this.save({ ...booking, ...changes });
    }
  }

  /**
   * Called once the seat map of a screening has loaded: keeps the booking when it is unpaid and
   * belongs to the screening, otherwise replaces it with an empty booking for the screening.
   */
  openFor(screeningId: number): void {
    const booking = this.load();
    if (booking === null || booking.paid !== undefined || booking.screeningId !== screeningId) {
      this.save({ screeningId, seats: [] });
    }
  }
}

/**
 * Lets a route with a `:id` parameter be entered only with an unpaid booking in progress for
 * that screening that has at least one seat; otherwise redirects to `/` (section 3.1).
 */
export const bookingGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const booking = inject(BookingService).load();
  const allowed =
    booking !== null &&
    booking.paid === undefined &&
    booking.seats.length > 0 &&
    booking.screeningId === Number(route.paramMap.get('id'));
  return allowed || inject(Router).createUrlTree(['/']);
};

/** Lets the confirmation be entered only with a paid booking; otherwise redirects to `/` (section 3.1). */
export const confirmationGuard: CanActivateFn = () => {
  const booking = inject(BookingService).load();
  return booking?.paid !== undefined || inject(Router).createUrlTree(['/']);
};

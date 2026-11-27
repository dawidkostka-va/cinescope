import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * One selectable element of the auditorium as booked: a single seat, or a couch that
 * covers `column` and `column + 1`.
 */
export interface BookedItem {
  row: number;
  column: number;
  couch: boolean;
}

/** The values typed into the checkout form (spec 7). */
export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

/** The booking in progress, kept in `sessionStorage` (spec 3.1). */
export interface Booking {
  screeningId: number;
  /** Selected seats and couches, in row then column order. */
  items: BookedItem[];
  form: CheckoutValues;
  /** The customer's email once the booking is paid; `null` while it is in progress. */
  paidEmail: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

/** A checkout form with nothing typed in. */
export function emptyCheckoutValues(): CheckoutValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

/** Identifiers of the seats an element occupies; a couch contributes both of its seats. */
export function seatIdentifiers(item: BookedItem): string[] {
  const columns = item.couch ? [item.column, item.column + 1] : [item.column];
  return columns.map((column) => `R${item.row}C${column}`);
}

/** Price of one element in PLN (spec 5.4). A couch is priced as a whole. */
export function priceOf(item: BookedItem): number {
  if (item.couch) {
    return 89;
  }
  if (item.row <= 5) {
    return 25;
  }
  if (item.row <= 10) {
    return 32;
  }
  return 39;
}

/** Total price of the items in PLN. */
export function totalPrice(items: readonly BookedItem[]): number {
  return items.reduce((sum, item) => sum + priceOf(item), 0);
}

/** Formats an amount as `25.00 PLN`. */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

/** Identifies a booked element; the same key the seat map uses for its elements. */
export function itemKey(item: BookedItem): string {
  return `${item.couch ? 'couch' : 'seat'}-${item.row}-${item.column}`;
}

function sortItems(items: readonly BookedItem[]): BookedItem[] {
  return [...items].sort((a, b) => a.row - b.row || a.column - b.column);
}

function readStoredBooking(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const stored = JSON.parse(raw) as Booking;
    return {
      ...stored,
      form: { ...emptyCheckoutValues(), ...stored.form },
      paidEmail: stored.paidEmail ?? null,
    };
  } catch {
    return null;
  }
}

/** Holds the booking in progress and mirrors it into `sessionStorage`. */
@Injectable({ providedIn: 'root' })
export class BookingStore {
  private readonly state = signal<Booking | null>(readStoredBooking());

  /** The booking in progress, or `null`. */
  readonly booking = this.state.asReadonly();

  /**
   * Keeps the booking in progress when it belongs to the screening and is unpaid; otherwise
   * starts an empty one.
   */
  open(screeningId: number): void {
    const current = this.state();
    if (current?.screeningId !== screeningId || current.paidEmail !== null) {
      this.write({ screeningId, items: [], form: emptyCheckoutValues(), paidEmail: null });
    }
  }

  /** Replaces the selected items of the booking in progress. */
  setItems(items: readonly BookedItem[]): void {
    const current = this.state();
    if (current) {
      this.write({ ...current, items: sortItems(items) });
    }
  }

  /** Sets one value of the checkout form in the booking in progress. */
  updateForm<K extends keyof CheckoutValues>(field: K, value: CheckoutValues[K]): void {
    const current = this.state();
    if (current) {
      this.write({ ...current, form: { ...current.form, [field]: value } });
    }
  }

  /** Marks the booking in progress as paid by the customer with this email address. */
  markPaid(email: string): void {
    const current = this.state();
    if (current) {
      this.write({ ...current, paidEmail: email });
    }
  }

  clear(): void {
    this.write(null);
  }

  private write(booking: Booking | null): void {
    this.state.set(booking);
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

/**
 * Lets a route open only while the booking in progress is unpaid, belongs to the screening in
 * the `id` parameter and holds at least one seat; otherwise redirects to `/`.
 */
export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingStore).booking();
  const allowed =
    booking !== null &&
    booking.paidEmail === null &&
    booking.screeningId === Number(route.paramMap.get('id')) &&
    booking.items.length > 0;
  return allowed || inject(Router).createUrlTree(['/']);
};

/** Lets a route open only once the booking is paid; otherwise redirects to `/` (spec 3.1). */
export const bookingPaidGuard: CanActivateFn = () => {
  const booking = inject(BookingStore).booking();
  return (booking !== null && booking.paidEmail !== null) || inject(Router).createUrlTree(['/']);
};

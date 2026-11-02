import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

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
  selection: string[];
  form?: CheckoutValues;
  paidEmail?: string;
}

export interface BookedItem {
  key: string;
  row: number;
  start: number;
  end: number;
  couch: boolean;
  seat: string;
  price: number;
}

const STORAGE_KEY = 'cinescope.booking';
const KEY_PATTERN = /^R(\d+)C(\d+)(?:-R\d+C(\d+))?$/;

@Injectable({ providedIn: 'root' })
export class BookingService {
  get(): Booking | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  }

  save(booking: Booking): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export const bookingInProgress: CanActivateFn = (route) => {
  const booking = inject(BookingService).get();
  const screeningId = Number(route.paramMap.get('id'));
  const valid =
    booking !== null &&
    booking.paidEmail === undefined &&
    booking.screeningId === screeningId &&
    booking.selection.length > 0;
  return valid || inject(Router).createUrlTree(['/']);
};

export const bookingPaid: CanActivateFn = () => {
  const booking = inject(BookingService).get();
  return booking?.paidEmail !== undefined || inject(Router).createUrlTree(['/']);
};

export function bookedItems(selection: string[]): BookedItem[] {
  return selection.map(parseKey).sort((a, b) => a.row - b.row || a.start - b.start);
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

function parseKey(key: string): BookedItem {
  const match = KEY_PATTERN.exec(key);
  if (!match) {
    throw new Error(`Invalid seat key: ${key}`);
  }
  const row = Number(match[1]);
  const start = Number(match[2]);
  const couch = match[3] !== undefined;
  const end = couch ? Number(match[3]) : start;
  return {
    key,
    row,
    start,
    end,
    couch,
    seat: couch ? `Couch ${start}-${end}` : `${start}`,
    price: priceOf(row, couch),
  };
}

function priceOf(row: number, couch: boolean): number {
  if (couch) {
    return 89;
  }
  if (row <= 5) {
    return 25;
  }
  return row <= 10 ? 32 : 39;
}

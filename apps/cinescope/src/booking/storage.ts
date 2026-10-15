import { Booking } from './types';

const STORAGE_KEY = 'cinescope.booking';

export function loadBooking(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

export function saveBooking(booking: Booking | null): void {
  if (booking) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

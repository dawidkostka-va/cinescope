import type { BookingState } from './types';

const STORAGE_KEY = 'cinescope.booking';

export function loadBooking(): BookingState | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingState;
  } catch {
    return null;
  }
}

export function saveBooking(booking: BookingState | null): void {
  if (booking === null) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

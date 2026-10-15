import { Booking } from './types';

const STORAGE_KEY = 'cinescope:booking';

export function loadBooking(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

export function saveBooking(booking: Booking): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

export function clearStoredBooking(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

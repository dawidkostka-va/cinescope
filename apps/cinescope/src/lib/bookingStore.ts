import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'cinescope.booking';

export interface BookingFormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  termsAccepted: boolean;
}

export interface BookingState {
  screeningId: number;
  seats: string[];
  form: BookingFormValues;
  paid: boolean;
  paidEmail: string | null;
}

function emptyForm(): BookingFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    termsAccepted: false,
  };
}

export function emptyBooking(screeningId: number): BookingState {
  return { screeningId, seats: [], form: emptyForm(), paid: false, paidEmail: null };
}

function readStorage(): BookingState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingState;
  } catch {
    return null;
  }
}

let booking: BookingState | null = readStorage();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBookingSnapshot(): BookingState | null {
  return booking;
}

export function setBooking(next: BookingState | null): void {
  booking = next;
  if (next) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  notify();
}

export function clearBooking(): void {
  setBooking(null);
}

export function ensureBookingForScreening(screeningId: number): BookingState {
  if (booking && booking.screeningId === screeningId && !booking.paid) {
    return booking;
  }
  const fresh = emptyBooking(screeningId);
  setBooking(fresh);
  return fresh;
}

export function useBooking(): BookingState | null {
  return useSyncExternalStore(subscribe, getBookingSnapshot, getBookingSnapshot);
}

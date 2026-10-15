import { createContext, ReactNode, useContext, useState } from 'react';
import { MAX_SEATS_PER_BOOKING } from '../lib/seats';
import { clearStoredBooking, loadBooking, saveBooking } from './storage';
import { Booking, CheckoutFormValues, emptyBooking } from './types';

export type ToggleResult = 'added' | 'removed' | 'rejected';

interface BookingContextValue {
  booking: Booking | null;
  ensureBookingForScreening: (screeningId: number) => void;
  toggleSelection: (identifiers: string[]) => ToggleResult;
  removeItem: (identifiers: string[]) => void;
  setFormField: <K extends keyof CheckoutFormValues>(field: K, value: CheckoutFormValues[K]) => void;
  markPaid: (email: string) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Booking | null>(() => loadBooking());

  function update(updater: (prev: Booking | null) => Booking | null) {
    setBooking((prev) => {
      const next = updater(prev);
      if (next) saveBooking(next);
      else clearStoredBooking();
      return next;
    });
  }

  function ensureBookingForScreening(screeningId: number) {
    update((prev) => {
      if (prev && prev.screeningId === screeningId && !prev.paid) return prev;
      return emptyBooking(screeningId);
    });
  }

  function toggleSelection(identifiers: string[]): ToggleResult {
    let result: ToggleResult = 'rejected';
    update((prev) => {
      if (!prev) return prev;
      const allSelected = identifiers.every((id) => prev.seats.includes(id));
      if (allSelected) {
        result = 'removed';
        return { ...prev, seats: prev.seats.filter((id) => !identifiers.includes(id)) };
      }
      if (prev.seats.length + identifiers.length > MAX_SEATS_PER_BOOKING) {
        result = 'rejected';
        return prev;
      }
      result = 'added';
      return { ...prev, seats: [...prev.seats, ...identifiers] };
    });
    return result;
  }

  function removeItem(identifiers: string[]) {
    update((prev) => (prev ? { ...prev, seats: prev.seats.filter((id) => !identifiers.includes(id)) } : prev));
  }

  function setFormField<K extends keyof CheckoutFormValues>(field: K, value: CheckoutFormValues[K]) {
    update((prev) => (prev ? { ...prev, form: { ...prev.form, [field]: value } } : prev));
  }

  function markPaid(email: string) {
    update((prev) => (prev ? { ...prev, paid: true, customerEmail: email } : prev));
  }

  function clearBooking() {
    update(() => null);
  }

  return (
    <BookingContext.Provider
      value={{ booking, ensureBookingForScreening, toggleSelection, removeItem, setFormField, markPaid, clearBooking }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within a BookingProvider');
  return context;
}

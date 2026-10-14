import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Booking, clearStoredBooking, loadBooking, saveBooking } from '../lib/booking';

interface BookingContextValue {
  booking: Booking | null;
  setBooking: (booking: Booking) => void;
  updateBooking: (updater: (booking: Booking) => Booking) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBookingState] = useState<Booking | null>(() => loadBooking());

  const setBooking = useCallback((next: Booking) => {
    setBookingState(next);
    saveBooking(next);
  }, []);

  const updateBooking = useCallback((updater: (booking: Booking) => Booking) => {
    setBookingState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveBooking(next);
      return next;
    });
  }, []);

  const clearBooking = useCallback(() => {
    setBookingState(null);
    clearStoredBooking();
  }, []);

  return (
    <BookingContext.Provider value={{ booking, setBooking, updateBooking, clearBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return ctx;
}

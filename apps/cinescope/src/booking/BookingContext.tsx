import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { loadBooking, saveBooking } from './storage';
import type { BookingState } from './types';

interface BookingContextValue {
  booking: BookingState | null;
  bookingRef: MutableRefObject<BookingState | null>;
  setBooking: (booking: BookingState | null) => void;
  updateBooking: (updater: (current: BookingState) => BookingState) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBookingState] = useState<BookingState | null>(() => loadBooking());
  const bookingRef = useRef<BookingState | null>(booking);

  const setBooking = useCallback((next: BookingState | null) => {
    bookingRef.current = next;
    saveBooking(next);
    setBookingState(next);
  }, []);

  const updateBooking = useCallback(
    (updater: (current: BookingState) => BookingState) => {
      const current = bookingRef.current;
      if (!current) return;
      const next = updater(current);
      bookingRef.current = next;
      saveBooking(next);
      setBookingState(next);
    },
    [],
  );

  const clearBooking = useCallback(() => {
    bookingRef.current = null;
    saveBooking(null);
    setBookingState(null);
  }, []);

  const value = useMemo(
    () => ({ booking, bookingRef, setBooking, updateBooking, clearBooking }),
    [booking, bookingRef, setBooking, updateBooking, clearBooking],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return ctx;
}

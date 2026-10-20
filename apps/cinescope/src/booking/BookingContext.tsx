import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Booking } from './types';
import { clearBookingStorage, loadBooking, saveBooking } from './storage';

interface BookingContextValue {
  booking: Booking | null;
  setBooking: Dispatch<SetStateAction<Booking | null>>;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Booking | null>(() => loadBooking());

  useEffect(() => {
    if (booking) {
      saveBooking(booking);
    } else {
      clearBookingStorage();
    }
  }, [booking]);

  return (
    <BookingContext.Provider value={{ booking, setBooking }}>
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

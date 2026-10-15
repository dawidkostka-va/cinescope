import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useToast } from '../toast/ToastContext';
import { MAX_SEATS_PER_BOOKING } from '../seating/layout';
import { loadBooking, saveBooking } from './storage';
import { Booking, CheckoutFormValues, createEmptyBooking } from './types';

interface BookingContextValue {
  booking: Booking | null;
  initForScreening: (screeningId: number) => void;
  toggleUnit: (ids: string[]) => void;
  removeUnit: (ids: string[]) => void;
  setFormField: <K extends keyof CheckoutFormValues>(key: K, value: CheckoutFormValues[K]) => void;
  markPaid: (email: string) => void;
  clear: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Booking | null>(() => loadBooking());
  const { showToast } = useToast();

  useEffect(() => {
    saveBooking(booking);
  }, [booking]);

  const initForScreening = useCallback((screeningId: number) => {
    setBooking((prev) => {
      if (prev && prev.screeningId === screeningId && !prev.paid) {
        return prev;
      }
      return createEmptyBooking(screeningId);
    });
  }, []);

  const toggleUnit = useCallback(
    (ids: string[]) => {
      setBooking((prev) => {
        if (!prev) return prev;
        const allSelected = ids.every((id) => prev.seats.includes(id));
        if (allSelected) {
          return { ...prev, seats: prev.seats.filter((id) => !ids.includes(id)) };
        }
        if (prev.seats.length + ids.length > MAX_SEATS_PER_BOOKING) {
          showToast('Maximum 10 seats per booking');
          return prev;
        }
        return { ...prev, seats: [...prev.seats, ...ids] };
      });
    },
    [showToast],
  );

  const removeUnit = useCallback((ids: string[]) => {
    setBooking((prev) => {
      if (!prev) return prev;
      return { ...prev, seats: prev.seats.filter((id) => !ids.includes(id)) };
    });
  }, []);

  const setFormField = useCallback(
    <K extends keyof CheckoutFormValues>(key: K, value: CheckoutFormValues[K]) => {
      setBooking((prev) => {
        if (!prev) return prev;
        return { ...prev, formValues: { ...prev.formValues, [key]: value } };
      });
    },
    [],
  );

  const markPaid = useCallback((email: string) => {
    setBooking((prev) => {
      if (!prev) return prev;
      return { ...prev, paid: true, customerEmail: email };
    });
  }, []);

  const clear = useCallback(() => {
    setBooking(null);
  }, []);

  return (
    <BookingContext.Provider
      value={{ booking, initForScreening, toggleUnit, removeUnit, setFormField, markPaid, clear }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

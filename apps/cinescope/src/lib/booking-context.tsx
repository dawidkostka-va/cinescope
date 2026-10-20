import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Booking, CheckoutForm, EMPTY_CHECKOUT_FORM } from './types';
import { MAX_SEATS } from './seat-geometry';

const STORAGE_KEY = 'cinescope-booking';

function readBooking(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
}

function writeBooking(booking: Booking | null): void {
  if (booking) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export type ToggleResult = 'added' | 'removed' | 'blocked';

interface BookingContextValue {
  booking: Booking | null;
  startBooking: (screeningId: number) => void;
  toggleUnit: (ids: string[]) => ToggleResult;
  removeUnit: (ids: string[]) => void;
  clearBooking: () => void;
  updateForm: (patch: Partial<CheckoutForm>) => void;
  markPaid: (email: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Booking | null>(() => readBooking());

  useEffect(() => {
    writeBooking(booking);
  }, [booking]);

  const startBooking = (screeningId: number) => {
    if (booking && !booking.paid && booking.screeningId === screeningId) {
      return;
    }
    setBooking({
      screeningId,
      seats: [],
      form: { ...EMPTY_CHECKOUT_FORM },
      paid: false,
      email: null,
    });
  };

  const toggleUnit = (ids: string[]): ToggleResult => {
    if (!booking) return 'blocked';
    const allSelected = ids.every((id) => booking.seats.includes(id));
    if (allSelected) {
      setBooking({ ...booking, seats: booking.seats.filter((id) => !ids.includes(id)) });
      return 'removed';
    }
    if (booking.seats.length + ids.length > MAX_SEATS) {
      return 'blocked';
    }
    setBooking({ ...booking, seats: [...booking.seats, ...ids] });
    return 'added';
  };

  const removeUnit = (ids: string[]) => {
    if (!booking) return;
    setBooking({ ...booking, seats: booking.seats.filter((id) => !ids.includes(id)) });
  };

  const clearBooking = () => setBooking(null);

  const updateForm = (patch: Partial<CheckoutForm>) => {
    if (!booking) return;
    setBooking({ ...booking, form: { ...booking.form, ...patch } });
  };

  const markPaid = (email: string) => {
    if (!booking) return;
    setBooking({ ...booking, paid: true, email });
  };

  return (
    <BookingContext.Provider
      value={{ booking, startBooking, toggleUnit, removeUnit, clearBooking, updateForm, markPaid }}
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

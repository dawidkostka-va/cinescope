import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export interface Booking {
  screeningId: number;
  seats: string[];
  form: CheckoutFormValues;
  paid: boolean;
  email: string | null;
}

const STORAGE_KEY = 'cinescope.booking';

const EMPTY_FORM: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function createEmptyBooking(screeningId: number): Booking {
  return { screeningId, seats: [], form: { ...EMPTY_FORM }, paid: false, email: null };
}

function loadBooking(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
}

interface BookingContextValue {
  booking: Booking | null;
  startBooking: (screeningId: number) => void;
  setSeats: (seats: string[]) => void;
  updateForm: (partial: Partial<CheckoutFormValues>) => void;
  clear: () => void;
  markPaid: (email: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Booking | null>(() => loadBooking());

  useEffect(() => {
    if (booking) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [booking]);

  const value = useMemo<BookingContextValue>(
    () => ({
      booking,
      startBooking: (screeningId) => {
        setBooking((current) => {
          if (current && current.screeningId === screeningId && !current.paid) return current;
          return createEmptyBooking(screeningId);
        });
      },
      setSeats: (seats) => {
        setBooking((current) => (current ? { ...current, seats } : current));
      },
      updateForm: (partial) => {
        setBooking((current) => (current ? { ...current, form: { ...current.form, ...partial } } : current));
      },
      clear: () => setBooking(null),
      markPaid: (email) => {
        setBooking((current) => (current ? { ...current, paid: true, email } : current));
      },
    }),
    [booking],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}

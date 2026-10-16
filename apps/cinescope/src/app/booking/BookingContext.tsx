import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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
  customerEmail: string | null;
}

const STORAGE_KEY = 'cinescope-booking';

const EMPTY_FORM: BookingFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  termsAccepted: false,
};

function readStoredBooking(): BookingState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingState;
  } catch {
    return null;
  }
}

function emptyBooking(screeningId: number): BookingState {
  return { screeningId, seats: [], form: { ...EMPTY_FORM }, paid: false, customerEmail: null };
}

interface BookingContextValue {
  booking: BookingState | null;
  ensureBookingForScreening: (screeningId: number) => void;
  toggleSeats: (ids: string[]) => boolean;
  removeSeats: (ids: string[]) => void;
  setFormField: <K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) => void;
  markPaid: (email: string) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState | null>(() => readStoredBooking());

  useEffect(() => {
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [booking]);

  const ensureBookingForScreening = (screeningId: number) => {
    setBooking((prev) => {
      if (prev && prev.screeningId === screeningId && !prev.paid) {
        return prev;
      }
      return emptyBooking(screeningId);
    });
  };

  const toggleSeats = (ids: string[]): boolean => {
    if (!booking) return false;
    const selectedSet = new Set(booking.seats);
    const allSelected = ids.every((id) => selectedSet.has(id));
    if (allSelected) {
      setBooking({ ...booking, seats: booking.seats.filter((id) => !ids.includes(id)) });
      return true;
    }
    if (booking.seats.length + ids.length > 10) {
      return false;
    }
    setBooking({ ...booking, seats: [...booking.seats, ...ids] });
    return true;
  };

  const removeSeats = (ids: string[]) => {
    if (!booking) return;
    setBooking({ ...booking, seats: booking.seats.filter((id) => !ids.includes(id)) });
  };

  const setFormField: BookingContextValue['setFormField'] = (field, value) => {
    if (!booking) return;
    setBooking({ ...booking, form: { ...booking.form, [field]: value } });
  };

  const markPaid = (email: string) => {
    if (!booking) return;
    setBooking({ ...booking, paid: true, customerEmail: email });
  };

  const clearBooking = () => {
    setBooking(null);
  };

  return (
    <BookingContext.Provider
      value={{
        booking,
        ensureBookingForScreening,
        toggleSeats,
        removeSeats,
        setFormField,
        markPaid,
        clearBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Booking, CheckoutFormValues } from './types';
import { MAX_SEATS } from './seats';

const STORAGE_KEY = 'cinescope.booking';

const EMPTY_FORM: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

function readStoredBooking(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.screeningId === 'number' &&
      Array.isArray(parsed.seats)
    ) {
      return parsed as Booking;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredBooking(booking: Booking | null): void {
  if (booking === null) {
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }
}

export type ToggleResult = 'selected' | 'deselected' | 'blocked';

interface BookingContextValue {
  booking: Booking | null;
  ensureBookingForScreening: (screeningId: number) => void;
  toggleSeats: (seatIds: string[]) => ToggleResult;
  removeSeats: (seatIds: string[]) => void;
  setForm: (form: CheckoutFormValues) => void;
  pay: (email: string) => void;
  clear: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: PropsWithChildren) {
  const [booking, setBookingState] = useState<Booking | null>(readStoredBooking);

  const setBooking = useCallback((next: Booking | null) => {
    writeStoredBooking(next);
    setBookingState(next);
  }, []);

  const ensureBookingForScreening = useCallback(
    (screeningId: number) => {
      setBookingState((current) => {
        if (current && current.screeningId === screeningId && !current.paid) {
          return current;
        }
        const next: Booking = {
          screeningId,
          seats: [],
          form: EMPTY_FORM,
          paid: false,
        };
        writeStoredBooking(next);
        return next;
      });
    },
    [],
  );

  const toggleSeats = useCallback(
    (seatIds: string[]): ToggleResult => {
      let result: ToggleResult = 'blocked';
      setBookingState((current) => {
        if (!current) return current;
        const allSelected = seatIds.every((id) => current.seats.includes(id));
        if (allSelected) {
          result = 'deselected';
          const next = {
            ...current,
            seats: current.seats.filter((id) => !seatIds.includes(id)),
          };
          writeStoredBooking(next);
          return next;
        }
        const missing = seatIds.filter((id) => !current.seats.includes(id));
        if (current.seats.length + missing.length > MAX_SEATS) {
          result = 'blocked';
          return current;
        }
        result = 'selected';
        const next = { ...current, seats: [...current.seats, ...missing] };
        writeStoredBooking(next);
        return next;
      });
      return result;
    },
    [],
  );

  const removeSeats = useCallback((seatIds: string[]) => {
    setBookingState((current) => {
      if (!current) return current;
      const next = {
        ...current,
        seats: current.seats.filter((id) => !seatIds.includes(id)),
      };
      writeStoredBooking(next);
      return next;
    });
  }, []);

  const setForm = useCallback((form: CheckoutFormValues) => {
    setBookingState((current) => {
      if (!current) return current;
      const next = { ...current, form };
      writeStoredBooking(next);
      return next;
    });
  }, []);

  const pay = useCallback((email: string) => {
    setBookingState((current) => {
      if (!current) return current;
      const next = { ...current, paid: true, email };
      writeStoredBooking(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setBooking(null);
  }, [setBooking]);

  return (
    <BookingContext.Provider
      value={{
        booking,
        ensureBookingForScreening,
        toggleSeats,
        removeSeats,
        setForm,
        pay,
        clear,
      }}
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

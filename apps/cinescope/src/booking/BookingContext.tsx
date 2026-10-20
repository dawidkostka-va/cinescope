import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Booking, BookingForm, createEmptyBooking } from './types';

const STORAGE_KEY = 'cinescope.booking';

function loadBooking(): Booking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking) : null;
  } catch {
    return null;
  }
}

function saveBooking(booking: Booking | null): void {
  if (booking === null) {
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  }
}

export type ToggleSeatResult = 'added' | 'removed' | 'limit';

interface BookingContextValue {
  booking: Booking | null;
  /** Keeps the booking in progress when it belongs to this screening and is unpaid, otherwise starts a new empty one. */
  startBookingForScreening: (screeningId: number) => void;
  /** Toggles a seat (one id) or a couch (two ids) as a single unit. */
  toggleSeatGroup: (ids: string[]) => ToggleSeatResult;
  removeSeats: (ids: string[]) => void;
  updateForm: (partial: Partial<BookingForm>) => void;
  markPaid: (email: string) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Booking | null>(() => loadBooking());

  useEffect(() => {
    saveBooking(booking);
  }, [booking]);

  function startBookingForScreening(screeningId: number): void {
    setBooking((prev) => {
      if (prev && prev.screeningId === screeningId && !prev.paid) {
        return prev;
      }
      return createEmptyBooking(screeningId);
    });
  }

  function toggleSeatGroup(ids: string[]): ToggleSeatResult {
    if (!booking) {
      return 'removed';
    }
    const isSelected = ids.every((id) => booking.seats.includes(id));
    if (isSelected) {
      setBooking({ ...booking, seats: booking.seats.filter((id) => !ids.includes(id)) });
      return 'removed';
    }
    if (booking.seats.length + ids.length > 10) {
      return 'limit';
    }
    setBooking({ ...booking, seats: [...booking.seats, ...ids] });
    return 'added';
  }

  function removeSeats(ids: string[]): void {
    if (!booking) return;
    setBooking({ ...booking, seats: booking.seats.filter((id) => !ids.includes(id)) });
  }

  function updateForm(partial: Partial<BookingForm>): void {
    if (!booking) return;
    setBooking({ ...booking, form: { ...booking.form, ...partial } });
  }

  function markPaid(email: string): void {
    if (!booking) return;
    setBooking({ ...booking, paid: true, customerEmail: email });
  }

  function clearBooking(): void {
    setBooking(null);
  }

  return (
    <BookingContext.Provider
      value={{ booking, startBookingForScreening, toggleSeatGroup, removeSeats, updateForm, markPaid, clearBooking }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const value = useContext(BookingContext);
  if (!value) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return value;
}

const STORAGE_KEY = 'cinescope.booking';

export interface BookingForm {
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
  form: BookingForm;
  paid: boolean;
  email: string | null;
}

export function emptyForm(): BookingForm {
  return {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    terms: false,
  };
}

export function loadBooking(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

export function saveBooking(booking: Booking): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

export function clearBooking(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function createBooking(screeningId: number): Booking {
  const booking: Booking = {
    screeningId,
    seats: [],
    form: emptyForm(),
    paid: false,
    email: null,
  };
  saveBooking(booking);
  return booking;
}

export function isUsableUnpaidBooking(
  booking: Booking | null,
  screeningId: number,
): booking is Booking {
  return (
    !!booking &&
    !booking.paid &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0
  );
}

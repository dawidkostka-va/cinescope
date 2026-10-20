const STORAGE_KEY = 'cinescope.booking';

export interface BookingFormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  termsAccepted: boolean;
}

export interface Booking {
  screeningId: number;
  seats: string[];
  formValues: BookingFormValues;
  paid: boolean;
  customerEmail: string | null;
}

export function createEmptyFormValues(): BookingFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    termsAccepted: false,
  };
}

export function createEmptyBooking(screeningId: number): Booking {
  return {
    screeningId,
    seats: [],
    formValues: createEmptyFormValues(),
    paid: false,
    customerEmail: null,
  };
}

export function readBooking(): Booking | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Booking;
  } catch {
    return null;
  }
}

export function writeBooking(booking: Booking): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

export function clearBooking(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** True when there is an unpaid booking for this screening with at least one seat. */
export function isUsableBookingFor(booking: Booking | null, screeningId: number): booking is Booking {
  return (
    booking !== null && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0
  );
}

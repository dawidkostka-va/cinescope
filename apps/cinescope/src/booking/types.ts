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
  customerEmail: string | null;
}

export const EMPTY_BOOKING_FORM: BookingForm = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

export function createEmptyBooking(screeningId: number): Booking {
  return {
    screeningId,
    seats: [],
    form: { ...EMPTY_BOOKING_FORM },
    paid: false,
    customerEmail: null,
  };
}

export function isBookingUsable(booking: Booking | null, screeningId: number): boolean {
  return booking !== null && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0;
}

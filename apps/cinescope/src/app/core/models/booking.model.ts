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
  paid: boolean;
  customerEmail: string | null;
  form: BookingForm;
}

export function emptyBookingForm(): BookingForm {
  return {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    terms: false,
  };
}

export function emptyBooking(screeningId: number): Booking {
  return {
    screeningId,
    seats: [],
    paid: false,
    customerEmail: null,
    form: emptyBookingForm(),
  };
}

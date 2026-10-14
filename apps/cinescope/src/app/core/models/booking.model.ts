export interface BookingFormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
}

export interface Booking {
  screeningId: number;
  seats: string[];
  form: BookingFormValues;
  paid: boolean;
  email: string | null;
}

export function emptyFormValues(): BookingFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
  };
}

export function newBooking(screeningId: number): Booking {
  return {
    screeningId,
    seats: [],
    form: emptyFormValues(),
    paid: false,
    email: null,
  };
}

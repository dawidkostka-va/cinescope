export interface CheckoutFormValues {
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
  paid: boolean;
  email: string | null;
  form: CheckoutFormValues;
}

export function emptyCheckoutForm(): CheckoutFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    termsAccepted: false,
  };
}

export function createBooking(screeningId: number): Booking {
  return {
    screeningId,
    seats: [],
    paid: false,
    email: null,
    form: emptyCheckoutForm(),
  };
}

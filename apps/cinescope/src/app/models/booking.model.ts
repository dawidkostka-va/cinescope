export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export interface BookingState {
  screeningId: number;
  seats: string[];
  form: CheckoutFormValues;
  paid: boolean;
  customerEmail: string | null;
}

export function emptyCheckoutForm(): CheckoutFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    terms: false,
  };
}

export function emptyBooking(screeningId: number): BookingState {
  return {
    screeningId,
    seats: [],
    form: emptyCheckoutForm(),
    paid: false,
    customerEmail: null,
  };
}

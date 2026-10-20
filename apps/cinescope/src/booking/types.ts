export interface CheckoutForm {
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
  form: CheckoutForm;
  paid: boolean;
  customerEmail: string | null;
}

export function emptyCheckoutForm(): CheckoutForm {
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
    form: emptyCheckoutForm(),
    paid: false,
    customerEmail: null,
  };
}

export interface CheckoutForm {
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
  form: CheckoutForm;
  paid: boolean;
  paidEmail: string | null;
}

export const emptyForm: CheckoutForm = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  termsAccepted: false,
};

export function createBooking(screeningId: number): Booking {
  return {
    screeningId,
    seats: [],
    form: { ...emptyForm },
    paid: false,
    paidEmail: null,
  };
}

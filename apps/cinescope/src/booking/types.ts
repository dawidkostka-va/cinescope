export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  acceptedTerms: boolean;
}

export interface Booking {
  screeningId: number;
  seats: string[];
  form: CheckoutFormValues;
  paid: boolean;
  customerEmail: string | null;
}

export const emptyCheckoutForm: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  acceptedTerms: false,
};

export function emptyBooking(screeningId: number): Booking {
  return {
    screeningId,
    seats: [],
    form: { ...emptyCheckoutForm },
    paid: false,
    customerEmail: null,
  };
}

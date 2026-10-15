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
  paid: boolean;
  email: string | null;
  form: CheckoutFormValues;
}

export const emptyForm: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  terms: false,
};

export function createEmptyBooking(screeningId: number): BookingState {
  return {
    screeningId,
    seats: [],
    paid: false,
    email: null,
    form: { ...emptyForm },
  };
}

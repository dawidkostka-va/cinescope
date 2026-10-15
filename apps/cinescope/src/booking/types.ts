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
  formValues: CheckoutFormValues;
  paid: boolean;
  customerEmail: string | null;
}

export const EMPTY_FORM_VALUES: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  confirmEmail: '',
  phone: '',
  termsAccepted: false,
};

export function createEmptyBooking(screeningId: number): Booking {
  return {
    screeningId,
    seats: [],
    formValues: { ...EMPTY_FORM_VALUES },
    paid: false,
    customerEmail: null,
  };
}

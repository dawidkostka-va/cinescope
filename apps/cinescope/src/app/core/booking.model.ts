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
  form: CheckoutFormValues;
  paid: boolean;
  customerEmail: string | null;
}

export function emptyForm(): CheckoutFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phone: '',
    termsAccepted: false,
  };
}

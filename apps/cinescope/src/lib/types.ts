export interface Movie {
  id: number;
  title: string;
  genre: string;
  runtimeMinutes: number;
  format: 'PL dubbing' | 'PL subtitles';
}

export interface Screening {
  id: number;
  movieId: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  occupiedSeats: string[];
}

export interface ReservationCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Reservation {
  id: number;
  screeningId: number;
  seats: string[];
  customer: ReservationCustomer;
  totalPrice: number;
}

export interface CheckoutFormValues {
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
  form: CheckoutFormValues;
  paid: boolean;
  email?: string;
}

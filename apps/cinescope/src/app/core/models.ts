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
  date: string; // ISO date, e.g. "2026-09-15"
  time: string; // "HH:mm"
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
  termsAccepted: boolean;
}

export interface Booking {
  screeningId: number;
  seats: string[];
  form: CheckoutFormValues;
  paid: boolean;
  email: string | null;
}

export interface ScreeningData {
  movie: Movie;
  screening: Screening;
}

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
  date: string;
  time: string;
  occupiedSeats: string[];
}

export interface MovieWithScreenings extends Movie {
  screenings: Screening[];
}

export interface ReservationCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ReservationPayload {
  screeningId: number;
  seats: string[];
  customer: ReservationCustomer;
  totalPrice: number;
}

export interface Reservation extends ReservationPayload {
  id: number;
}

export interface BookingFormValues {
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
  form: BookingFormValues;
  paid: boolean;
  customerEmail: string | null;
}

export function emptyFormValues(): BookingFormValues {
  return { firstName: '', lastName: '', email: '', confirmEmail: '', phone: '', terms: false };
}

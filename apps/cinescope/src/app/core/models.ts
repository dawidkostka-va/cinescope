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

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ReservationRequest {
  screeningId: number;
  seats: string[];
  customer: Customer;
  totalPrice: number;
}

export interface Reservation extends ReservationRequest {
  id: number;
}

export interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

/** `items` are seat keys (`R<row>C<column>`); a couch is keyed by its first column. */
export interface Booking {
  screeningId: number;
  items: string[];
  form: FormValues;
  paid: boolean;
  email: string;
}

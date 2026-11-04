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

export interface Reservation {
  id?: number;
  screeningId: number;
  seats: string[];
  customer: Customer;
  totalPrice: number;
}

/** A selected seat (start === end) or a couch (two adjacent columns). */
export interface SeatItem {
  row: number;
  start: number;
  end: number;
}

export interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

export interface Booking {
  screeningId: number;
  items: SeatItem[];
  form: FormValues;
  paid: boolean;
  email: string;
}

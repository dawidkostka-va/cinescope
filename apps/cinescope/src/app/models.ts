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
  /** ISO date, YYYY-MM-DD */
  date: string;
  /** HH:mm, 24-hour */
  time: string;
  occupiedSeats: string[];
}

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  /** "" when not provided */
  phone: string;
}

export interface Reservation {
  id: number;
  screeningId: number;
  /** Seat identifiers; a couch contributes both of its identifiers. */
  seats: string[];
  customer: Customer;
  /** In PLN */
  totalPrice: number;
}

/** A reservation as sent to the backend, before it assigns the id. */
export type NewReservation = Omit<Reservation, 'id'>;

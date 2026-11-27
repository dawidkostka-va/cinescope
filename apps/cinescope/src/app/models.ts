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
  /** Empty when not provided. */
  phone: string;
}

export interface Reservation {
  id: number;
  screeningId: number;
  /** Seat identifiers; a couch contributes both of its identifiers. */
  seats: string[];
  customer: Customer;
  /** Total in PLN. */
  totalPrice: number;
}

/** A reservation to be created: the backend assigns the `id`. */
export type NewReservation = Omit<Reservation, 'id'>;

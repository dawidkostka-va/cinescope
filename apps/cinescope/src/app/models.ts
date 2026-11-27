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
  id: number;
  screeningId: number;
  seats: string[];
  customer: Customer;
  totalPrice: number;
}

/** A reservation as sent to the backend, before it has an `id`. */
export type NewReservation = Omit<Reservation, 'id'>;

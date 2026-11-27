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

export interface Reservation {
  id: number;
  screeningId: number;
  seats: string[];
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    /** `""` when not provided. */
    phone: string;
  };
  /** In PLN. */
  totalPrice: number;
}

/** A reservation before the backend assigns its `id`: the body of `POST /reservations`. */
export type NewReservation = Omit<Reservation, 'id'>;

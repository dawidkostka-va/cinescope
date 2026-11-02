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
    phone: string;
  };
  totalPrice: number;
}

export type NewReservation = Omit<Reservation, 'id'>;

export interface ScreeningDetails {
  screening: Screening;
  movie: Movie;
}

export interface CheckoutValues {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  terms: boolean;
}

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

export interface ReservationCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ReservationInput {
  screeningId: number;
  seats: string[];
  customer: ReservationCustomer;
  totalPrice: number;
}

export interface Reservation extends ReservationInput {
  id: number;
}

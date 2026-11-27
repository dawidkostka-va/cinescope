export const API_BASE_URL = 'http://localhost:3000';

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

/** Body of `POST /reservations` (section 2.2). */
export interface NewReservation {
  screeningId: number;
  seats: string[];
  customer: Customer;
  totalPrice: number;
}

export interface Reservation extends NewReservation {
  id: number;
}

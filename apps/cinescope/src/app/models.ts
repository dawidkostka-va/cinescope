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

export interface NewReservation {
  screeningId: number;
  seats: string[];
  customer: Customer;
  totalPrice: number;
}

export interface Reservation extends NewReservation {
  id: number;
}

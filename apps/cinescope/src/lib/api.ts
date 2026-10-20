import { Movie, Reservation, ReservationCustomer, Screening } from './types';

const BASE_URL = 'http://localhost:3000';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return response.json() as Promise<T>;
}

export function fetchMovies(): Promise<Movie[]> {
  return getJson<Movie[]>('/movies');
}

export function fetchMovie(movieId: number): Promise<Movie> {
  return getJson<Movie>(`/movies/${movieId}`);
}

export function fetchScreeningsByDate(date: string): Promise<Screening[]> {
  return getJson<Screening[]>(`/screenings?date=${date}`);
}

export function fetchScreening(screeningId: number): Promise<Screening> {
  return getJson<Screening>(`/screenings/${screeningId}`);
}

export interface CreateReservationPayload {
  screeningId: number;
  seats: string[];
  customer: ReservationCustomer;
  totalPrice: number;
}

export async function createReservation(
  payload: CreateReservationPayload,
): Promise<Reservation> {
  const response = await fetch(`${BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to create reservation');
  }
  return response.json() as Promise<Reservation>;
}

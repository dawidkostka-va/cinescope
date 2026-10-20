import { Movie, Reservation, ReservationCustomer, Screening } from '../types';

const BASE_URL = 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export function fetchMovies(): Promise<Movie[]> {
  return request<Movie[]>('/movies');
}

export function fetchMovie(id: number): Promise<Movie> {
  return request<Movie>(`/movies/${id}`);
}

export function fetchScreeningsByDate(date: string): Promise<Screening[]> {
  return request<Screening[]>(`/screenings?date=${encodeURIComponent(date)}`);
}

export function fetchScreening(id: number): Promise<Screening> {
  return request<Screening>(`/screenings/${id}`);
}

export interface CreateReservationPayload {
  screeningId: number;
  seats: string[];
  customer: ReservationCustomer;
  totalPrice: number;
}

export function createReservation(payload: CreateReservationPayload): Promise<Reservation> {
  return request<Reservation>('/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

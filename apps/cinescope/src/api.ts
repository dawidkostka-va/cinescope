import type { Movie, Screening, ReservationInput, Reservation } from './types';

const BASE_URL = 'http://localhost:3000';

async function getJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchMovies(): Promise<Movie[]> {
  return getJSON<Movie[]>('/movies');
}

export function fetchScreeningsByDate(date: string): Promise<Screening[]> {
  return getJSON<Screening[]>(`/screenings?date=${encodeURIComponent(date)}`);
}

export function fetchScreening(id: number | string): Promise<Screening> {
  return getJSON<Screening>(`/screenings/${id}`);
}

export function fetchMovie(id: number | string): Promise<Movie> {
  return getJSON<Movie>(`/movies/${id}`);
}

export async function createReservation(input: ReservationInput): Promise<Reservation> {
  const response = await fetch(`${BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Reservation request failed with status ${response.status}`);
  }
  return response.json() as Promise<Reservation>;
}

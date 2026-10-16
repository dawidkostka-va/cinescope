import type { Movie, NewReservation, Reservation, Screening } from './types';

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

export function fetchScreening(id: number): Promise<Screening> {
  return getJson<Screening>(`/screenings/${id}`);
}

export function fetchScreenings(): Promise<Screening[]> {
  return getJson<Screening[]>('/screenings');
}

export function fetchMovie(id: number): Promise<Movie> {
  return getJson<Movie>(`/movies/${id}`);
}

export async function createReservation(reservation: NewReservation): Promise<Reservation> {
  const response = await fetch(`${BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservation),
  });
  if (!response.ok) {
    throw new Error('Reservation request failed');
  }
  return response.json() as Promise<Reservation>;
}

import { CreateReservationPayload, Movie, Reservation, Screening } from './types';

const BASE_URL = 'http://localhost:3000';

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json() as Promise<T>;
}

export function fetchMovies(): Promise<Movie[]> {
  return getJSON<Movie[]>('/movies');
}

export function fetchMovie(id: number): Promise<Movie> {
  return getJSON<Movie>(`/movies/${id}`);
}

export function fetchScreeningsByDate(date: string): Promise<Screening[]> {
  return getJSON<Screening[]>(`/screenings?date=${encodeURIComponent(date)}`);
}

export function fetchScreening(id: number): Promise<Screening> {
  return getJSON<Screening>(`/screenings/${id}`);
}

export async function createReservation(
  payload: CreateReservationPayload,
): Promise<Reservation> {
  const res = await fetch(`${BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create reservation');
  return res.json() as Promise<Reservation>;
}

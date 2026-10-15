import { CreateReservationPayload, Movie, Reservation, Screening } from './types';

const BASE_URL = 'http://localhost:3000';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchMovies(): Promise<Movie[]> {
  return getJson<Movie[]>('/movies');
}

export function fetchScreenings(): Promise<Screening[]> {
  return getJson<Screening[]>('/screenings');
}

export function fetchScreening(id: number): Promise<Screening> {
  return getJson<Screening>(`/screenings/${id}`);
}

export function fetchMovie(id: number): Promise<Movie> {
  return getJson<Movie>(`/movies/${id}`);
}

export async function createReservation(
  payload: CreateReservationPayload,
): Promise<Reservation> {
  const res = await fetch(`${BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create reservation, status ${res.status}`);
  }
  return res.json() as Promise<Reservation>;
}

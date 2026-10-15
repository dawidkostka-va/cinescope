import type { CreateReservation, Movie, Reservation, Screening } from './types';

const BASE_URL = 'http://localhost:3000';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return response.json() as Promise<T>;
}

export function getMovies(): Promise<Movie[]> {
  return getJson<Movie[]>('/movies');
}

export function getScreening(id: string | number): Promise<Screening> {
  return getJson<Screening>(`/screenings/${id}`);
}

export function getScreeningsByDate(date: string): Promise<Screening[]> {
  return getJson<Screening[]>(`/screenings?date=${encodeURIComponent(date)}`);
}

export async function createReservation(
  reservation: CreateReservation,
): Promise<Reservation> {
  const response = await fetch(`${BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservation),
  });
  if (!response.ok) {
    throw new Error('Failed to create reservation');
  }
  return response.json() as Promise<Reservation>;
}

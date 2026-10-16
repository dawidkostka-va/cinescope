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

export function fetchScreenings(): Promise<Screening[]> {
  return getJson<Screening[]>('/screenings');
}

export async function fetchScreening(id: string | number): Promise<Screening> {
  const response = await fetch(`${BASE_URL}/screenings/${id}`);
  if (!response.ok) {
    throw new Error(`Screening not found: ${id}`);
  }
  return response.json() as Promise<Screening>;
}

export async function fetchMovie(id: number): Promise<Movie> {
  const response = await fetch(`${BASE_URL}/movies/${id}`);
  if (!response.ok) {
    throw new Error(`Movie not found: ${id}`);
  }
  return response.json() as Promise<Movie>;
}

export interface CreateReservationInput {
  screeningId: number;
  seats: string[];
  customer: ReservationCustomer;
  totalPrice: number;
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<Reservation> {
  const response = await fetch(`${BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Failed to create reservation');
  }
  return response.json() as Promise<Reservation>;
}

import { Movie, Reservation, ReservationInput, Screening } from './types';

const BASE_URL = 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getMovies(): Promise<Movie[]> {
  return request<Movie[]>('/movies');
}

export function getMovie(id: number): Promise<Movie> {
  return request<Movie>(`/movies/${id}`);
}

export function getScreenings(filters: { date?: string; movieId?: number } = {}): Promise<Screening[]> {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.movieId !== undefined) params.set('movieId', String(filters.movieId));
  const query = params.toString();
  return request<Screening[]>(`/screenings${query ? `?${query}` : ''}`);
}

export function getScreening(id: number): Promise<Screening> {
  return request<Screening>(`/screenings/${id}`);
}

export function createReservation(input: ReservationInput): Promise<Reservation> {
  return request<Reservation>('/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

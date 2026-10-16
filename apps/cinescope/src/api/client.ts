import { Movie, Reservation, ReservationInput, Screening } from './types';

const BASE_URL = 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchMovies(): Promise<Movie[]> {
  return request<Movie[]>('/movies');
}

export function fetchMovie(id: number): Promise<Movie> {
  return request<Movie>(`/movies/${id}`);
}

export function fetchScreenings(params: { date?: string; movieId?: number } = {}): Promise<Screening[]> {
  const search = new URLSearchParams();
  if (params.date) search.set('date', params.date);
  if (params.movieId !== undefined) search.set('movieId', String(params.movieId));
  const query = search.toString();
  return request<Screening[]>(`/screenings${query ? `?${query}` : ''}`);
}

export function fetchScreening(id: number): Promise<Screening> {
  return request<Screening>(`/screenings/${id}`);
}

export function createReservation(payload: ReservationInput): Promise<Reservation> {
  return request<Reservation>('/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

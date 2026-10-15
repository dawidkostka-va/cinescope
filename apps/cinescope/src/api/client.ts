import { Movie, NewReservation, Reservation, Screening } from './types';

const BASE_URL = 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new Error(`Network error while requesting ${path}`);
  }
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export function getMovies(): Promise<Movie[]> {
  return request<Movie[]>('/movies');
}

export function getMovie(id: number): Promise<Movie> {
  return request<Movie>(`/movies/${id}`);
}

export function getScreenings(params?: { date?: string; movieId?: number }): Promise<Screening[]> {
  const search = new URLSearchParams();
  if (params?.date) search.set('date', params.date);
  if (params?.movieId !== undefined) search.set('movieId', String(params.movieId));
  const query = search.toString();
  return request<Screening[]>(`/screenings${query ? `?${query}` : ''}`);
}

export function getScreening(id: number): Promise<Screening> {
  return request<Screening>(`/screenings/${id}`);
}

export function createReservation(reservation: NewReservation): Promise<Reservation> {
  return request<Reservation>('/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservation),
  });
}

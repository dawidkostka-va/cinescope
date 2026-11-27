import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie, NewReservation, Reservation, Screening } from './models';

export const API_BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${API_BASE_URL}/movies`);
  }

  getScreeningsByDate(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${API_BASE_URL}/screenings`, { params: { date } });
  }

  getScreening(id: string): Observable<Screening> {
    return this.http.get<Screening>(`${API_BASE_URL}/screenings/${encodeURIComponent(id)}`);
  }

  getMovie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${API_BASE_URL}/movies/${id}`);
  }

  createReservation(reservation: NewReservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${API_BASE_URL}/reservations`, reservation);
  }
}

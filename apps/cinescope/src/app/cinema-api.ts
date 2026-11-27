import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie, Reservation, Screening } from './models';

const API_BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class CinemaApi {
  private readonly http = inject(HttpClient);

  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${API_BASE_URL}/movies`);
  }

  getScreenings(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${API_BASE_URL}/screenings`, { params: { date } });
  }

  getScreening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${API_BASE_URL}/screenings/${id}`);
  }

  getMovie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${API_BASE_URL}/movies/${id}`);
  }

  createReservation(reservation: Omit<Reservation, 'id'>): Observable<Reservation> {
    return this.http.post<Reservation>(`${API_BASE_URL}/reservations`, reservation);
  }
}

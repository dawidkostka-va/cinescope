import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie, Reservation, ReservationPayload, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  getMovie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${BASE_URL}/movies/${id}`);
  }

  getScreeningsByDate(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`, { params: { date } });
  }

  getScreening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  createReservation(payload: ReservationPayload): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, payload);
  }
}

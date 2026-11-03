import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie, Reservation, ReservationRequest, Screening } from './models';

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

  getScreenings(): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`);
  }

  getScreening(id: number | string): Observable<Screening> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  createReservation(body: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, body);
  }
}

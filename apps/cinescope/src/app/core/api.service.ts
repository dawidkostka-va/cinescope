import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateReservationRequest, Movie, Reservation, Screening } from './models';

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

  getScreenings(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`, { params: { date } });
  }

  getScreening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  createReservation(request: CreateReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, request);
  }
}

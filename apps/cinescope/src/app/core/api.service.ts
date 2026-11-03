import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie, Reservation, ReservationRequest, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  movie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${BASE_URL}/movies/${id}`);
  }

  screenings(): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`);
  }

  screening(id: string | number): Observable<Screening> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${encodeURIComponent(String(id))}`);
  }

  createReservation(body: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, body);
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie, NewReservation, Reservation, Screening } from './models';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class CinemaApi {
  private readonly http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${API_URL}/movies`);
  }

  movie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${API_URL}/movies/${id}`);
  }

  screeningsOn(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${API_URL}/screenings`, { params: { date } });
  }

  screening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${API_URL}/screenings/${id}`);
  }

  createReservation(reservation: NewReservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${API_URL}/reservations`, reservation);
  }
}

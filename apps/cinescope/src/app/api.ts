import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie, Reservation, Screening } from './models';

const BASE = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${BASE}/movies`);
  }
  movie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${BASE}/movies/${id}`);
  }
  screenings(): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE}/screenings`);
  }
  screening(id: string | number): Observable<Screening> {
    return this.http.get<Screening>(`${BASE}/screenings/${id}`);
  }
  reserve(reservation: Reservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE}/reservations`, reservation);
  }
}

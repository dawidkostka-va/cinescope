import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { Movie, Reservation, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  screenings(): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`);
  }

  screeningWithMovie(id: string | number): Observable<{ screening: Screening; movie: Movie }> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${encodeURIComponent(id)}`).pipe(
      switchMap((screening) =>
        this.http.get<Movie>(`${BASE_URL}/movies/${screening.movieId}`).pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }

  createReservation(reservation: Reservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, reservation);
  }
}

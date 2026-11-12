import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { Movie, Reservation, ReservationRequest, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  loadMoviesAndScreenings(): Observable<{ movies: Movie[]; screenings: Screening[] }> {
    return forkJoin({
      movies: this.http.get<Movie[]>(`${BASE_URL}/movies`),
      screenings: this.http.get<Screening[]>(`${BASE_URL}/screenings`),
    });
  }

  loadScreening(id: string | number): Observable<{ screening: Screening; movie: Movie }> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${encodeURIComponent(id)}`).pipe(
      switchMap((screening) =>
        this.http
          .get<Movie>(`${BASE_URL}/movies/${screening.movieId}`)
          .pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }

  createReservation(body: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, body);
  }
}

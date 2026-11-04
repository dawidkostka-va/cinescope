import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { Movie, Reservation, ReservationRequest, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class Api {
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

  screening(id: number | string): Observable<Screening> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  reserve(request: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, request);
  }

  screeningWithMovie(id: number | string): Observable<{ screening: Screening; movie: Movie }> {
    return this.screening(id).pipe(
      switchMap((screening) => this.movie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
    );
  }
}

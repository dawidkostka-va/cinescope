import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { Movie, NewReservation, Reservation, Screening } from './models';

const API_BASE_URL = 'http://localhost:3000';

export interface ScreeningWithMovie {
  screening: Screening;
  movie: Movie;
}

@Injectable({ providedIn: 'root' })
export class CinemaApi {
  private readonly http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${API_BASE_URL}/movies`);
  }

  movie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${API_BASE_URL}/movies/${id}`);
  }

  screeningsOn(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${API_BASE_URL}/screenings`, { params: { date } });
  }

  screening(id: string): Observable<Screening> {
    return this.http.get<Screening>(`${API_BASE_URL}/screenings/${encodeURIComponent(id)}`);
  }

  createReservation(reservation: NewReservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${API_BASE_URL}/reservations`, reservation);
  }

  /** A screening together with its movie; fails when either request fails. */
  screeningWithMovie(id: string): Observable<ScreeningWithMovie> {
    return this.screening(id).pipe(
      switchMap((screening) =>
        this.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { Movie, NewReservation, Reservation, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

export interface ScreeningWithMovie {
  screening: Screening;
  movie: Movie;
}

@Injectable({ providedIn: 'root' })
export class CinescopeApi {
  private readonly http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  movie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${BASE_URL}/movies/${id}`);
  }

  screeningsOn(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`, { params: { date } });
  }

  screening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  screeningWithMovie(id: number): Observable<ScreeningWithMovie> {
    return this.screening(id).pipe(
      switchMap((screening) =>
        this.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }

  createReservation(reservation: NewReservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, reservation);
  }
}

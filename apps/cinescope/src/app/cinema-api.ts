import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { Movie, NewReservation, Reservation, Screening, ScreeningDetails } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class CinemaApi {
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

  createReservation(reservation: NewReservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, reservation);
  }

  screeningWithMovie(id: number): Observable<ScreeningDetails> {
    return this.screening(id).pipe(
      switchMap((screening) =>
        this.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }
}

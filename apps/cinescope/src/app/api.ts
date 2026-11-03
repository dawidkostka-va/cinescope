import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, switchMap } from 'rxjs';
import { Movie, NewReservation, Reservation, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class CinemaApi {
  private readonly http = inject(HttpClient);

  movies() {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  movie(id: number) {
    return this.http.get<Movie>(`${BASE_URL}/movies/${id}`);
  }

  screenings() {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`);
  }

  screening(id: number) {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  screeningWithMovie(id: number) {
    return this.screening(id).pipe(
      switchMap((screening) => this.movie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
    );
  }

  createReservation(reservation: NewReservation) {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, reservation);
  }
}

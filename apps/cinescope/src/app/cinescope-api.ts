import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, forkJoin, map, switchMap } from 'rxjs';
import { Movie, NewReservation, Reservation, Screening } from './models';

const API_BASE_URL = 'http://localhost:3000';

export interface MovieListData {
  movies: Movie[];
  screenings: Screening[];
}

export interface ScreeningDetails {
  screening: Screening;
  movie: Movie;
}

@Injectable({ providedIn: 'root' })
export class CinescopeApi {
  private readonly http = inject(HttpClient);

  /** Loads all movies and all screenings in parallel. */
  loadMovieList(): Promise<MovieListData> {
    return firstValueFrom(
      forkJoin({
        movies: this.http.get<Movie[]>(`${API_BASE_URL}/movies`),
        screenings: this.http.get<Screening[]>(`${API_BASE_URL}/screenings`),
      }),
    );
  }

  /** Creates the reservation of a paid booking. Any failure rejects the promise. */
  createReservation(reservation: NewReservation): Promise<Reservation> {
    return firstValueFrom(this.http.post<Reservation>(`${API_BASE_URL}/reservations`, reservation));
  }

  /** Loads one screening and then its movie. */
  loadScreening(id: number): Promise<ScreeningDetails> {
    return firstValueFrom(
      this.http.get<Screening>(`${API_BASE_URL}/screenings/${id}`).pipe(
        switchMap((screening) =>
          this.http
            .get<Movie>(`${API_BASE_URL}/movies/${screening.movieId}`)
            .pipe(map((movie) => ({ screening, movie }))),
        ),
      ),
    );
  }
}

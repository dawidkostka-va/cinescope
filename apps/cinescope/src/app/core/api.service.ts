import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { Movie, Reservation, ReservationCustomer, Screening, ScreeningData } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  getMovie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${BASE_URL}/movies/${id}`);
  }

  getScreenings(): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`);
  }

  getScreening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  getMovieAndScreening(screeningId: number): Observable<ScreeningData> {
    return this.getScreening(screeningId).pipe(
      switchMap((screening) => this.getMovie(screening.movieId).pipe(map((movie) => ({ movie, screening })))),
    );
  }

  getMoviesAndScreenings(): Observable<{ movies: Movie[]; screenings: Screening[] }> {
    return forkJoin({ movies: this.getMovies(), screenings: this.getScreenings() });
  }

  createReservation(payload: {
    screeningId: number;
    seats: string[];
    customer: ReservationCustomer;
    totalPrice: number;
  }): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, payload);
  }
}

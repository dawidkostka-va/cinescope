import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { Movie, ReservationRequest, Screening } from './models';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${API_URL}/movies`);
  }

  getMovie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${API_URL}/movies/${id}`);
  }

  getScreenings(): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${API_URL}/screenings`);
  }

  getScreening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${API_URL}/screenings/${id}`);
  }

  getScreeningWithMovie(id: number): Observable<{ screening: Screening; movie: Movie }> {
    return this.getScreening(id).pipe(
      switchMap((screening) =>
        this.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }

  getMoviesWithScreenings(): Observable<{ movies: Movie[]; screenings: Screening[] }> {
    return forkJoin({ movies: this.getMovies(), screenings: this.getScreenings() });
  }

  createReservation(request: ReservationRequest): Observable<unknown> {
    return this.http.post(`${API_URL}/reservations`, request);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { Movie, ReservationRequest, Screening } from './models';

const BASE = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${BASE}/movies`);
  }

  screenings(): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE}/screenings`);
  }

  moviesAndScreenings(): Observable<{ movies: Movie[]; screenings: Screening[] }> {
    return forkJoin({ movies: this.movies(), screenings: this.screenings() });
  }

  screeningWithMovie(id: string | number): Observable<{ screening: Screening; movie: Movie }> {
    return this.http.get<Screening>(`${BASE}/screenings/${encodeURIComponent(String(id))}`).pipe(
      switchMap((screening) =>
        this.http.get<Movie>(`${BASE}/movies/${screening.movieId}`).pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }

  reserve(body: ReservationRequest): Observable<unknown> {
    return this.http.post(`${BASE}/reservations`, body);
  }
}

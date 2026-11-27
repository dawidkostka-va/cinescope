import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { API_BASE_URL, Movie, Screening } from './models';

export interface LoadedScreening {
  screening: Screening;
  movie: Movie;
}

/** Loads a screening together with its movie. Errors are passed on to the caller. */
@Injectable({ providedIn: 'root' })
export class ScreeningLoader {
  private readonly http = inject(HttpClient);

  load(id: string): Observable<LoadedScreening> {
    return this.http.get<Screening>(`${API_BASE_URL}/screenings/${id}`).pipe(
      switchMap((screening) =>
        this.http
          .get<Movie>(`${API_BASE_URL}/movies/${screening.movieId}`)
          .pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }
}

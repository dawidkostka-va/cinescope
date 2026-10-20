import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Movie, Screening } from './models';

export interface ScreeningData {
  screening: Screening;
  movie: Movie;
}

/** Loads the screening and its movie; redirects to `/` and cancels navigation on any failure. */
export const screeningDataResolver: ResolveFn<ScreeningData> = (route): Observable<ScreeningData> => {
  const api = inject(ApiService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));

  return api.getScreening(id).pipe(
    switchMap((screening) => api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
    catchError(() => {
      router.navigateByUrl('/');
      return EMPTY;
    }),
  );
};

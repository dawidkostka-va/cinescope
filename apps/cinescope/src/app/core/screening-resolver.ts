import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { Movie, Screening } from './models';

export interface ScreeningData {
  screening: Screening;
  movie: Movie;
}

export const screeningResolver: ResolveFn<ScreeningData | RedirectCommand> = (route) => {
  const api = inject(ApiService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));

  return api.getScreening(id).pipe(
    switchMap((screening) => api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
    catchError(() => of(new RedirectCommand(router.parseUrl('/')))),
  );
};

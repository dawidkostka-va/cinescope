import { Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ResolveFn, Router } from '@angular/router';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { Movie, Screening } from './models';

export interface ScreeningWithMovie {
  screening: Screening;
  movie: Movie;
}

/** Loads the screening and its movie; redirects to `/` when either request fails. */
export const screeningResolver: ResolveFn<ScreeningWithMovie> = (route) => {
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

/** Reads the `ScreeningWithMovie` resolved by {@link screeningResolver} for the current route, reactively. */
export function injectResolvedScreening(): Signal<ScreeningWithMovie> {
  const route = inject(ActivatedRoute);
  const data = toSignal(route.data, { initialValue: route.snapshot.data });
  return computed(() => data()['data'] as ScreeningWithMovie);
}

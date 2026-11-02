import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { ScreeningView } from './models';

export const screeningViewResolver: ResolveFn<ScreeningView | RedirectCommand> = (
  route: ActivatedRouteSnapshot,
) => {
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));
  return inject(ApiService)
    .screeningView(id)
    .pipe(catchError(() => of(new RedirectCommand(router.parseUrl('/')))));
};

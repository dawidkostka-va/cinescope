import { Route } from '@angular/router';
import { bookingInProgressGuard, paidGuard } from './core/guards';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./movies/movie-list').then((m) => m.MovieList),
  },
  {
    path: 'screenings/:id/seats',
    loadComponent: () => import('./seats/seat-map').then((m) => m.SeatMap),
  },
  {
    path: 'screenings/:id/summary',
    canActivate: [bookingInProgressGuard],
    loadComponent: () => import('./summary/summary').then((m) => m.Summary),
  },
  {
    path: 'screenings/:id/checkout',
    canActivate: [bookingInProgressGuard],
    loadComponent: () => import('./checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'confirmation',
    canActivate: [paidGuard],
    loadComponent: () => import('./confirmation/confirmation').then((m) => m.Confirmation),
  },
  { path: '**', redirectTo: '' },
];

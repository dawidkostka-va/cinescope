import { Route } from '@angular/router';
import { inProgressBookingGuard, paidBookingGuard } from './core/guards';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/movie-list/movie-list').then((m) => m.MovieList),
  },
  {
    path: 'screenings/:id/seats',
    loadComponent: () => import('./pages/seat-map/seat-map').then((m) => m.SeatMap),
  },
  {
    path: 'screenings/:id/summary',
    canActivate: [inProgressBookingGuard],
    loadComponent: () => import('./pages/summary/summary').then((m) => m.Summary),
  },
  {
    path: 'screenings/:id/checkout',
    canActivate: [inProgressBookingGuard],
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'confirmation',
    canActivate: [paidBookingGuard],
    loadComponent: () => import('./pages/confirmation/confirmation').then((m) => m.Confirmation),
  },
  { path: '**', redirectTo: '' },
];

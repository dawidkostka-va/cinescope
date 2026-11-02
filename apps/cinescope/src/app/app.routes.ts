import { Route } from '@angular/router';
import { inProgressBookingGuard, paidBookingGuard } from './core/guards';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./movie-list/movie-list').then((m) => m.MovieList),
  },
  {
    path: 'screenings/:id/seats',
    loadComponent: () => import('./seat-selection/seat-selection').then((m) => m.SeatSelection),
  },
  {
    path: 'screenings/:id/summary',
    canActivate: [inProgressBookingGuard],
    loadComponent: () => import('./summary/summary').then((m) => m.Summary),
  },
  {
    path: 'screenings/:id/checkout',
    canActivate: [inProgressBookingGuard],
    loadComponent: () => import('./checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'confirmation',
    canActivate: [paidBookingGuard],
    loadComponent: () => import('./confirmation/confirmation').then((m) => m.Confirmation),
  },
  { path: '**', redirectTo: '' },
];

import { Route } from '@angular/router';
import { paidBookingGuard, unpaidBookingGuard } from './core/guards';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/movie-list/movie-list').then((m) => m.MovieList) },
  {
    path: 'screenings/:id/seats',
    loadComponent: () => import('./pages/seat-selection/seat-selection').then((m) => m.SeatSelection),
  },
  {
    path: 'screenings/:id/summary',
    canActivate: [unpaidBookingGuard],
    loadComponent: () => import('./pages/summary/summary').then((m) => m.Summary),
  },
  {
    path: 'screenings/:id/checkout',
    canActivate: [unpaidBookingGuard],
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'confirmation',
    canActivate: [paidBookingGuard],
    loadComponent: () => import('./pages/confirmation/confirmation').then((m) => m.Confirmation),
  },
  { path: '**', redirectTo: '' },
];

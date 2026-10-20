import { Route } from '@angular/router';
import { activeBookingGuard, paidBookingGuard } from './guards/booking.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/movie-list/movie-list').then((m) => m.MovieList),
  },
  {
    path: 'screenings/:id/seats',
    loadComponent: () => import('./pages/seat-selection/seat-selection').then((m) => m.SeatSelection),
  },
  {
    path: 'screenings/:id/summary',
    loadComponent: () => import('./pages/summary/summary').then((m) => m.Summary),
    canActivate: [activeBookingGuard],
  },
  {
    path: 'screenings/:id/checkout',
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
    canActivate: [activeBookingGuard],
  },
  {
    path: 'confirmation',
    loadComponent: () => import('./pages/confirmation/confirmation').then((m) => m.Confirmation),
    canActivate: [paidBookingGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

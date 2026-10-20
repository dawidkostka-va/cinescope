import { Route } from '@angular/router';
import { activeBookingGuard, paidBookingGuard } from './core/booking.guards';
import { MovieList } from './movie-list/movie-list';

export const appRoutes: Route[] = [
  { path: '', component: MovieList },
  {
    path: 'screenings/:id/seats',
    loadComponent: () => import('./seat-selection/seat-selection').then((m) => m.SeatSelection),
  },
  {
    path: 'screenings/:id/summary',
    loadComponent: () => import('./summary/summary').then((m) => m.Summary),
    canActivate: [activeBookingGuard],
  },
  {
    path: 'screenings/:id/checkout',
    loadComponent: () => import('./checkout/checkout').then((m) => m.Checkout),
    canActivate: [activeBookingGuard],
  },
  {
    path: 'confirmation',
    loadComponent: () => import('./confirmation/confirmation').then((m) => m.Confirmation),
    canActivate: [paidBookingGuard],
  },
  { path: '**', redirectTo: '' },
];

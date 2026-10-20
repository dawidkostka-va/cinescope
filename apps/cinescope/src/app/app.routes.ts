import { Route } from '@angular/router';
import { paidBookingGuard, unpaidBookingGuard } from './core/booking.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/movie-list/movie-list.component').then((m) => m.MovieListComponent),
  },
  {
    path: 'screenings/:id/seats',
    loadComponent: () => import('./pages/seat-map/seat-map.component').then((m) => m.SeatMapComponent),
  },
  {
    path: 'screenings/:id/summary',
    loadComponent: () => import('./pages/summary/summary.component').then((m) => m.SummaryComponent),
    canActivate: [unpaidBookingGuard],
  },
  {
    path: 'screenings/:id/checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
    canActivate: [unpaidBookingGuard],
  },
  {
    path: 'confirmation',
    loadComponent: () => import('./pages/confirmation/confirmation.component').then((m) => m.ConfirmationComponent),
    canActivate: [paidBookingGuard],
  },
  { path: '**', redirectTo: '' },
];

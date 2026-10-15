import { Route } from '@angular/router';
import { bookingInProgressGuard } from './core/guards/booking-in-progress.guard';
import { paidBookingGuard } from './core/guards/paid-booking.guard';

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
    canActivate: [bookingInProgressGuard],
    loadComponent: () => import('./pages/summary/summary.component').then((m) => m.SummaryComponent),
  },
  {
    path: 'screenings/:id/checkout',
    canActivate: [bookingInProgressGuard],
    loadComponent: () => import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'confirmation',
    canActivate: [paidBookingGuard],
    loadComponent: () => import('./pages/confirmation/confirmation.component').then((m) => m.ConfirmationComponent),
  },
  { path: '**', redirectTo: '' },
];

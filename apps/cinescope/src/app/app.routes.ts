import { Route } from '@angular/router';
import { bookingInProgressGuard, paidBookingGuard } from './core/booking.guard';
import { screeningResolver } from './core/screening-resolver';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./features/movie-list/movie-list.component').then((m) => m.MovieListComponent),
  },
  {
    path: 'screenings/:id/seats',
    loadComponent: () => import('./features/seat-map/seat-map.component').then((m) => m.SeatMapComponent),
    resolve: { data: screeningResolver },
  },
  {
    path: 'screenings/:id/summary',
    loadComponent: () => import('./features/summary/summary.component').then((m) => m.SummaryComponent),
    canActivate: [bookingInProgressGuard],
    resolve: { data: screeningResolver },
  },
  {
    path: 'screenings/:id/checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent),
    canActivate: [bookingInProgressGuard],
    resolve: { data: screeningResolver },
  },
  {
    path: 'confirmation',
    loadComponent: () =>
      import('./features/confirmation/confirmation.component').then((m) => m.ConfirmationComponent),
    canActivate: [paidBookingGuard],
  },
  { path: '**', redirectTo: '' },
];

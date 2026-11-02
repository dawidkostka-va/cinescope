import { Routes } from '@angular/router';
import { MovieList } from './movie-list/movie-list';
import { paidBookingGuard, unpaidBookingGuard } from './core/booking.guards';

export const appRoutes: Routes = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', loadComponent: () => import('./seat-map/seat-map').then((m) => m.SeatMap) },
  {
    path: 'screenings/:id/summary',
    canActivate: [unpaidBookingGuard],
    loadComponent: () => import('./summary/summary').then((m) => m.Summary),
  },
  {
    path: 'screenings/:id/checkout',
    canActivate: [unpaidBookingGuard],
    loadComponent: () => import('./checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'confirmation',
    canActivate: [paidBookingGuard],
    loadComponent: () => import('./confirmation/confirmation').then((m) => m.Confirmation),
  },
  { path: '**', redirectTo: '' },
];

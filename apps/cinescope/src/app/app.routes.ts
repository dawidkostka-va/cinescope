import { inject } from '@angular/core';
import { CanActivateFn, Route, Router } from '@angular/router';
import { BookingService } from './core/booking.service';

const unpaidBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const ok =
    !!booking &&
    booking.paidEmail == null &&
    booking.screeningId === Number(route.paramMap.get('id')) &&
    booking.seats.length > 0;
  return ok || inject(Router).createUrlTree(['/']);
};

const paidBookingGuard: CanActivateFn = () =>
  inject(BookingService).isPaid() || inject(Router).createUrlTree(['/']);

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./movie-list/movie-list').then((m) => m.MovieList),
  },
  {
    path: 'screenings/:id/seats',
    loadComponent: () => import('./seat-map/seat-map').then((m) => m.SeatMap),
  },
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

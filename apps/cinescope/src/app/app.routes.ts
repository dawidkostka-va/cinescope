import { Route } from '@angular/router';
import { Checkout } from './features/checkout/checkout';
import { Confirmation } from './features/confirmation/confirmation';
import { MovieList } from './features/movie-list/movie-list';
import { SeatMap } from './features/seat-map/seat-map';
import { Summary } from './features/summary/summary';
import { bookingInProgressGuard, paidBookingGuard } from './core/guards';
import { screeningDataResolver } from './core/resolvers';

export const appRoutes: Route[] = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatMap, resolve: { data: screeningDataResolver } },
  {
    path: 'screenings/:id/summary',
    component: Summary,
    resolve: { data: screeningDataResolver },
    canActivate: [bookingInProgressGuard],
  },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [bookingInProgressGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

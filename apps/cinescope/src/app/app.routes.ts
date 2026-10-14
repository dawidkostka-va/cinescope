import { Route } from '@angular/router';
import { bookingInProgressGuard } from './core/guards/booking-in-progress.guard';
import { paidBookingGuard } from './core/guards/paid-booking.guard';
import { Checkout } from './features/checkout/checkout';
import { Confirmation } from './features/confirmation/confirmation';
import { MovieList } from './features/movie-list/movie-list';
import { SeatMap } from './features/seat-map/seat-map';
import { Summary } from './features/summary/summary';

export const appRoutes: Route[] = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatMap },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [bookingInProgressGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [bookingInProgressGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

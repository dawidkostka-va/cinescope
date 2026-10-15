import { Route } from '@angular/router';
import { bookingInProgressGuard, paidBookingGuard } from './core/booking.guard';
import { Checkout } from './features/checkout/checkout';
import { Confirmation } from './features/confirmation/confirmation';
import { MovieList } from './features/movie-list/movie-list';
import { SeatSelection } from './features/seat-selection/seat-selection';
import { Summary } from './features/summary/summary';

export const appRoutes: Route[] = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatSelection },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [bookingInProgressGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [bookingInProgressGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

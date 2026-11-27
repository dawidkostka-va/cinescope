import { Route } from '@angular/router';
import { bookingGuard, paidBookingGuard } from './booking';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';
import { MovieList } from './movie-list/movie-list';
import { SeatSelection } from './seat-selection/seat-selection';
import { Summary } from './summary/summary';

export const appRoutes: Route[] = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatSelection },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [bookingGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [bookingGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

import { Route } from '@angular/router';
import { paidBookingGuard, unpaidBookingGuard } from './booking/booking.service';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';
import { MovieList } from './movie-list/movie-list';
import { SeatSelection } from './seat-selection/seat-selection';
import { Summary } from './summary/summary';

export const appRoutes: Route[] = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatSelection },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [unpaidBookingGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [unpaidBookingGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

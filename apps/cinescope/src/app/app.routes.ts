import { Route } from '@angular/router';
import { inProgressBookingGuard, paidBookingGuard } from './booking/booking';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';
import { MovieList } from './movie-list/movie-list';
import { SeatSelection } from './seats/seat-selection';
import { Summary } from './summary/summary';

export const appRoutes: Route[] = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatSelection },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [inProgressBookingGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [inProgressBookingGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

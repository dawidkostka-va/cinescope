import { Routes } from '@angular/router';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';
import { bookingInProgress, bookingPaid } from './booking-guards';
import { MovieList } from './movie-list/movie-list';
import { SeatSelection } from './seat-selection/seat-selection';
import { Summary } from './summary/summary';

export const appRoutes: Routes = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatSelection },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [bookingInProgress] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [bookingInProgress] },
  { path: 'confirmation', component: Confirmation, canActivate: [bookingPaid] },
  { path: '**', redirectTo: '' },
];

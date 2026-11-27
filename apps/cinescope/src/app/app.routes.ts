import { Routes } from '@angular/router';
import { bookingInProgressGuard, bookingPaidGuard } from './booking';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';
import { MovieList } from './movie-list/movie-list';
import { SeatSelection } from './seat-selection/seat-selection';
import { Summary } from './summary/summary';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatSelection },
  { path: 'screenings/:id/summary', canActivate: [bookingInProgressGuard], component: Summary },
  { path: 'screenings/:id/checkout', canActivate: [bookingInProgressGuard], component: Checkout },
  { path: 'confirmation', canActivate: [bookingPaidGuard], component: Confirmation },
  { path: '**', redirectTo: '' },
];

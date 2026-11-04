import { Routes } from '@angular/router';
import { bookingInProgressGuard, bookingPaidGuard } from './booking/booking.guards';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';
import { MovieList } from './movie-list/movie-list';
import { SeatMap } from './seat-map/seat-map';
import { Summary } from './summary/summary';

export const appRoutes: Routes = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatMap },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [bookingInProgressGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [bookingInProgressGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [bookingPaidGuard] },
  { path: '**', redirectTo: '' },
];

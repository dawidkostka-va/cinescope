import { Route } from '@angular/router';
import { paidBookingGuard, unpaidBookingGuard } from './booking/booking.guards';
import { Confirmation } from './confirmation/confirmation';
import { Checkout } from './checkout/checkout';
import { MovieList } from './movie-list/movie-list';
import { SeatMap } from './seat-map/seat-map';
import { Summary } from './summary/summary';

export const appRoutes: Route[] = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatMap },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [unpaidBookingGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [unpaidBookingGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

import { Route } from '@angular/router';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';
import { paidBookingGuard, unpaidBookingGuard } from './guards';
import { MovieList } from './movie-list/movie-list';
import { SeatMap } from './seat-map/seat-map';
import { Summary } from './summary/summary';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatMap },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [unpaidBookingGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [unpaidBookingGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

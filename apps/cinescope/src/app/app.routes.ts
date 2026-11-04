import { Route } from '@angular/router';
import { paidBookingGuard, unpaidBookingGuard } from './core/guards';
import { MovieList } from './movie-list/movie-list';
import { SeatMap } from './seat-map/seat-map';
import { Summary } from './summary/summary';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';

export const appRoutes: Route[] = [
  { path: '', component: MovieList, pathMatch: 'full' },
  { path: 'screenings/:id/seats', component: SeatMap },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [unpaidBookingGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [unpaidBookingGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

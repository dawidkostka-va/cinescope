import { Routes } from '@angular/router';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';
import { inProgressBookingGuard, paidBookingGuard } from './core/booking.guards';
import { MovieList } from './movie-list/movie-list';
import { SeatMap } from './seat-map/seat-map';
import { Summary } from './summary/summary';

export const appRoutes: Routes = [
  { path: '', component: MovieList },
  { path: 'screenings/:id/seats', component: SeatMap },
  { path: 'screenings/:id/summary', component: Summary, canActivate: [inProgressBookingGuard] },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [inProgressBookingGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

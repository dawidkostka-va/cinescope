import { Routes } from '@angular/router';
import { Checkout } from './checkout/checkout';
import { Confirmation } from './confirmation/confirmation';
import { MovieList } from './movie-list/movie-list';
import { paidBookingGuard, openBookingGuard } from './booking.guards';
import { screeningViewResolver } from './screening-view.resolver';
import { SeatMap } from './seat-map/seat-map';
import { Summary } from './summary/summary';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', component: MovieList },
  {
    path: 'screenings/:id/seats',
    component: SeatMap,
    resolve: { view: screeningViewResolver },
  },
  {
    path: 'screenings/:id/summary',
    component: Summary,
    canActivate: [openBookingGuard],
    resolve: { view: screeningViewResolver },
  },
  { path: 'screenings/:id/checkout', component: Checkout, canActivate: [openBookingGuard] },
  { path: 'confirmation', component: Confirmation, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

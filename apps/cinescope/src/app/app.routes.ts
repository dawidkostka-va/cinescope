import { Route } from '@angular/router';
import { bookingInProgressGuard, paidBookingGuard } from './core/guards';
import { screeningResolver } from './core/screening-resolver';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { ConfirmationComponent } from './features/confirmation/confirmation.component';
import { MovieListComponent } from './features/movie-list/movie-list.component';
import { SeatMapComponent } from './features/seat-map/seat-map.component';
import { SummaryComponent } from './features/summary/summary.component';

export const appRoutes: Route[] = [
  { path: '', component: MovieListComponent },
  {
    path: 'screenings/:id/seats',
    component: SeatMapComponent,
    resolve: { data: screeningResolver },
  },
  {
    path: 'screenings/:id/summary',
    component: SummaryComponent,
    canActivate: [bookingInProgressGuard],
    resolve: { data: screeningResolver },
  },
  {
    path: 'screenings/:id/checkout',
    component: CheckoutComponent,
    canActivate: [bookingInProgressGuard],
    resolve: { data: screeningResolver },
  },
  {
    path: 'confirmation',
    component: ConfirmationComponent,
    canActivate: [paidBookingGuard],
  },
  { path: '**', redirectTo: '' },
];

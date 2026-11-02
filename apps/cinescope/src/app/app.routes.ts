import { Route } from '@angular/router';
import { MovieListComponent } from './movie-list/movie-list';
import { bookingInProgress, bookingPaid } from './booking';
import { CheckoutComponent } from './checkout/checkout';
import { ConfirmationComponent } from './confirmation/confirmation';
import { SeatSelectionComponent } from './seat-selection/seat-selection';
import { SummaryComponent } from './summary/summary';

export const appRoutes: Route[] = [
  { path: '', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatSelectionComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [bookingInProgress] },
  {
    path: 'screenings/:id/checkout',
    component: CheckoutComponent,
    canActivate: [bookingInProgress],
  },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [bookingPaid] },
  { path: '**', redirectTo: '' },
];

import { Route } from '@angular/router';
import { CheckoutComponent } from './checkout/checkout.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { bookingInProgressGuard, paidBookingGuard } from './guards';
import { MovieListComponent } from './movie-list/movie-list.component';
import { SeatSelectionComponent } from './seat-selection/seat-selection.component';
import { SummaryComponent } from './summary/summary.component';

export const appRoutes: Route[] = [
  { path: '', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatSelectionComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [bookingInProgressGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutComponent, canActivate: [bookingInProgressGuard] },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

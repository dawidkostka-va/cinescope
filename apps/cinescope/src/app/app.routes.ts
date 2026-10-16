import { Route } from '@angular/router';
import { bookingInProgressGuard, bookingPaidGuard } from './core/booking.guards';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { ConfirmationComponent } from './pages/confirmation/confirmation.component';
import { MovieListComponent } from './pages/movie-list/movie-list.component';
import { SeatSelectionComponent } from './pages/seat-selection/seat-selection.component';
import { SummaryComponent } from './pages/summary/summary.component';

export const appRoutes: Route[] = [
  { path: '', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatSelectionComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [bookingInProgressGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutComponent, canActivate: [bookingInProgressGuard] },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [bookingPaidGuard] },
  { path: '**', redirectTo: '' },
];

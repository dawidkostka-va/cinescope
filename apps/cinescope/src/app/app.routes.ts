import { Route } from '@angular/router';
import { MovieListComponent } from './movies/movie-list.component';
import { SeatMapComponent } from './seats/seat-map.component';
import { SummaryComponent } from './summary/summary.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { bookingInProgressGuard, bookingPaidGuard } from './core/guards';

export const appRoutes: Route[] = [
  { path: '', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatMapComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [bookingInProgressGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutComponent, canActivate: [bookingInProgressGuard] },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [bookingPaidGuard] },
  { path: '**', redirectTo: '' },
];

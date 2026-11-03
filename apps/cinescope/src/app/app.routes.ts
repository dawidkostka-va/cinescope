import { Route } from '@angular/router';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { bookingInProgressGuard, bookingPaidGuard } from './core/booking.guard';
import { CheckoutComponent } from './checkout/checkout.component';
import { MovieListComponent } from './movie-list/movie-list.component';
import { SeatMapComponent } from './seat-map/seat-map.component';
import { SummaryComponent } from './summary/summary.component';

export const appRoutes: Route[] = [
  { path: '', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatMapComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [bookingInProgressGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutComponent, canActivate: [bookingInProgressGuard] },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [bookingPaidGuard] },
  { path: '**', redirectTo: '' },
];

import { Routes } from '@angular/router';
import { CheckoutComponent } from './checkout/checkout.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { paidBookingGuard, unpaidBookingGuard } from './core/booking.guards';
import { MovieListComponent } from './movies/movie-list.component';
import { SeatSelectionComponent } from './seats/seat-selection.component';
import { SummaryComponent } from './summary/summary.component';

export const appRoutes: Routes = [
  { path: '', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatSelectionComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [unpaidBookingGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutComponent, canActivate: [unpaidBookingGuard] },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

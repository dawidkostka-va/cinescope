import { Route } from '@angular/router';
import { paidBookingGuard, unpaidBookingGuard } from './core/guards';
import { MovieListComponent } from './movies/movie-list';
import { SeatSelectionComponent } from './seats/seat-selection';
import { SummaryComponent } from './summary/summary';
import { CheckoutComponent } from './checkout/checkout';
import { ConfirmationComponent } from './confirmation/confirmation';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatSelectionComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [unpaidBookingGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutComponent, canActivate: [unpaidBookingGuard] },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

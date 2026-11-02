import { Route } from '@angular/router';
import { paidBookingGuard, unpaidBookingGuard } from './core/guards';
import { MovieListComponent } from './movie-list/movie-list';
import { SeatMapComponent } from './seat-map/seat-map';
import { SummaryComponent } from './summary/summary';
import { CheckoutComponent } from './checkout/checkout';
import { ConfirmationComponent } from './confirmation/confirmation';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatMapComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [unpaidBookingGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutComponent, canActivate: [unpaidBookingGuard] },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

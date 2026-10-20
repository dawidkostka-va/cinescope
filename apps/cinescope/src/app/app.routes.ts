import { Route } from '@angular/router';
import { inProgressBookingGuard, paidBookingGuard } from './core/guards';
import { CheckoutComponent } from './features/checkout/checkout';
import { ConfirmationComponent } from './features/confirmation/confirmation';
import { MovieListComponent } from './features/movie-list/movie-list';
import { SeatMapComponent } from './features/seat-map/seat-map';
import { SummaryComponent } from './features/summary/summary';

export const appRoutes: Route[] = [
  { path: '', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatMapComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [inProgressBookingGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutComponent, canActivate: [inProgressBookingGuard] },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

import { Route } from '@angular/router';
import { ConfirmationComponent } from './features/confirmation/confirmation.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { MovieListComponent } from './features/movie-list/movie-list.component';
import { SeatSelectionComponent } from './features/seat-selection/seat-selection.component';
import { SummaryComponent } from './features/summary/summary.component';
import { activeBookingGuard, paidBookingGuard } from './core/guards';

export const appRoutes: Route[] = [
  { path: '', component: MovieListComponent },
  { path: 'screenings/:id/seats', component: SeatSelectionComponent },
  { path: 'screenings/:id/summary', component: SummaryComponent, canActivate: [activeBookingGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutComponent, canActivate: [activeBookingGuard] },
  { path: 'confirmation', component: ConfirmationComponent, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

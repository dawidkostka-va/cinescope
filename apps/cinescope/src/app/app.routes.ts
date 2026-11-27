import { Route } from '@angular/router';
import { paidBookingGuard, unpaidBookingGuard } from './booking-guards';
import { ConfirmationPage } from './confirmation/confirmation-page';
import { CheckoutPage } from './checkout/checkout-page';
import { MoviesPage } from './movies/movies-page';
import { SeatsPage } from './seats/seats-page';
import { SummaryPage } from './summary/summary-page';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', component: MoviesPage },
  { path: 'screenings/:id/seats', component: SeatsPage },
  { path: 'screenings/:id/summary', component: SummaryPage, canActivate: [unpaidBookingGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutPage, canActivate: [unpaidBookingGuard] },
  { path: 'confirmation', component: ConfirmationPage, canActivate: [paidBookingGuard] },
  { path: '**', redirectTo: '' },
];

import { Route } from '@angular/router';
import { inProgressGuard, paidGuard } from './guards';
import { CheckoutPage } from './pages/checkout';
import { ConfirmationPage } from './pages/confirmation';
import { MovieListPage } from './pages/movie-list';
import { SeatMapPage } from './pages/seat-map';
import { SummaryPage } from './pages/summary';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', component: MovieListPage },
  { path: 'screenings/:id/seats', component: SeatMapPage },
  { path: 'screenings/:id/summary', component: SummaryPage, canActivate: [inProgressGuard] },
  { path: 'screenings/:id/checkout', component: CheckoutPage, canActivate: [inProgressGuard] },
  { path: 'confirmation', component: ConfirmationPage, canActivate: [paidGuard] },
  { path: '**', redirectTo: '' },
];

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const openBookingGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const booking = inject(BookingService).current();
  const screeningId = Number(route.paramMap.get('id'));
  const allowed =
    !!booking && !booking.paid && booking.screeningId === screeningId && booking.selections.length > 0;
  return allowed || router.createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const router = inject(Router);
  return !!inject(BookingService).current()?.paid || router.createUrlTree(['/']);
};

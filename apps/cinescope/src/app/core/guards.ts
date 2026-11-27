import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const unpaidBookingGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const booking = inject(BookingService).booking();
  const id = Number(route.paramMap.get('id'));
  const allowed = !!booking && !booking.paid && booking.screeningId === id && booking.seats.length > 0;
  return allowed || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  return !!booking?.paid || inject(Router).createUrlTree(['/']);
};

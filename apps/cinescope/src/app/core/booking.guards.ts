import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const unpaidBookingGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const booking = inject(BookingService).booking();
  const valid =
    !!booking &&
    !booking.paid &&
    booking.seats.length > 0 &&
    booking.screeningId === Number(route.paramMap.get('id'));
  return valid || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  return !!booking?.paid || inject(Router).createUrlTree(['/']);
};

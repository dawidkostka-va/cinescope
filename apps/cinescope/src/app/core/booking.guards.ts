import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking';

export const inProgressBookingGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const booking = inject(BookingService).booking();
  const screeningId = Number(route.paramMap.get('id'));
  const allowed =
    booking !== null &&
    booking.paidEmail === null &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0;
  return allowed || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  return booking?.paidEmail != null || inject(Router).createUrlTree(['/']);
};

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { BookingStore } from './booking.store';

export const unpaidBookingGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const booking = inject(BookingStore).booking();
  const screeningId = Number(route.paramMap.get('id'));
  const allowed =
    booking !== null &&
    booking.paidEmail === null &&
    booking.screeningId === screeningId &&
    booking.seats.length > 0;
  return allowed || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingStore).booking();
  return booking?.paidEmail != null || inject(Router).createUrlTree(['/']);
};

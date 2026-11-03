import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const allowed =
    !!booking &&
    booking.paidEmail === null &&
    booking.screeningId === Number(route.paramMap.get('id')) &&
    booking.seats.length > 0;
  return allowed || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  return (!!booking && booking.paidEmail !== null) || inject(Router).createUrlTree(['/']);
};

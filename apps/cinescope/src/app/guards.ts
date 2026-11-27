import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const allowed =
    !!booking &&
    !booking.paid &&
    String(booking.screeningId) === route.paramMap.get('id') &&
    booking.seats.length > 0;
  return allowed || inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  return !!booking?.paid || inject(Router).createUrlTree(['/']);
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const screeningId = Number(route.paramMap.get('id'));
  if (booking && !booking.paidEmail && booking.screeningId === screeningId && booking.seats.length > 0) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};

export const bookingPaidGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  if (booking?.paidEmail) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};

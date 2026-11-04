import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const open =
    booking !== null &&
    booking.paidEmail === null &&
    booking.screeningId === Number(route.paramMap.get('id')) &&
    booking.seats.length > 0;
  return open || inject(Router).createUrlTree(['/']);
};

export const bookingPaidGuard: CanActivateFn = () => {
  return !!inject(BookingService).booking()?.paidEmail || inject(Router).createUrlTree(['/']);
};

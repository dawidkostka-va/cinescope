import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const screeningId = Number(route.paramMap.get('id'));
  const allowed = booking.screeningId() === screeningId && booking.seatCount() > 0 && booking.paidEmail() === null;
  return allowed || inject(Router).createUrlTree(['/']);
};

export const bookingPaidGuard: CanActivateFn = () => {
  const booking = inject(BookingService);
  return booking.paidEmail() !== null || inject(Router).createUrlTree(['/']);
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const activeBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const id = Number(route.paramMap.get('id'));
  if (booking && !booking.paid && booking.screeningId === id && booking.seats.length > 0) return true;
  return inject(Router).createUrlTree(['/']);
};

export const paidBookingGuard: CanActivateFn = () => {
  if (inject(BookingService).booking()?.paid) return true;
  return inject(Router).createUrlTree(['/']);
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const unpaidBookingGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService).booking();
  const router = inject(Router);
  const screeningId = Number(route.paramMap.get('id'));

  if (!booking.paid && booking.screeningId === screeningId && booking.seats.length > 0) {
    return true;
  }
  return router.parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService).booking();
  const router = inject(Router);

  return booking.paid ? true : router.parseUrl('/');
};

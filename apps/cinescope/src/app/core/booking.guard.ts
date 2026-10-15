import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const screeningId = Number(route.paramMap.get('id'));
  const booking = bookingService.booking();
  if (booking && !booking.paid && booking.screeningId === screeningId && booking.seats.length > 0) {
    return true;
  }
  return router.parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const booking = bookingService.booking();
  if (booking && booking.paid) {
    return true;
  }
  return router.parseUrl('/');
};

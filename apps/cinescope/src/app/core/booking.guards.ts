import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const activeBookingGuard: CanActivateFn = (route) => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));
  const booking = bookingService.booking();
  if (booking && !booking.paid && booking.screeningId === id && booking.seats.length > 0) {
    return true;
  }
  return router.parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const booking = bookingService.booking();
  return booking?.paid ? true : router.parseUrl('/');
};

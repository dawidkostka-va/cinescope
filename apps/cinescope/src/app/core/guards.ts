import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const inProgressBookingGuard: CanActivateFn = (route) => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  const screeningId = Number(route.paramMap.get('id'));
  const booking = bookingService.booking();
  if (booking && booking.screeningId === screeningId && !booking.paid && booking.seats.length > 0) {
    return true;
  }
  return router.parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  const bookingService = inject(BookingService);
  const router = inject(Router);
  return bookingService.isPaid() ? true : router.parseUrl('/');
};

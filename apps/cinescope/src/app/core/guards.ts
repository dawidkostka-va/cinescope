import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from './booking.service';

export const bookingInProgressGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));
  return booking.matchesUnpaid(id) && booking.hasSeats() ? true : router.parseUrl('/');
};

export const paidBookingGuard: CanActivateFn = () => {
  const booking = inject(BookingService);
  const router = inject(Router);
  return booking.isPaid() ? true : router.parseUrl('/');
};
